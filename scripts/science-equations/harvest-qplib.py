#!/usr/bin/env python3
"""Harvest QPLIB native models as reconstructed optimization occurrences."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
import hashlib
import io
import json
from pathlib import Path
import re
import sqlite3
import sys
import tempfile
from typing import Iterator, TextIO

SOURCE_ID = "qplib-quadratic-programs"
SOURCE_LICENSE = "CC-BY-4.0"
SOURCE_LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/"
SOURCE_POLICY_URL = "https://qplib.zib.de/"
SOURCE_DOC_URL = "https://qplib.zib.de/doc.html"
PROBLEM_TYPE_RE = re.compile(r"^[LDCQ][CBMIG][NBLDCQ]$")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_text(text: str) -> str:
    return sha256_bytes(text.encode("utf-8"))


def sha256_json(value: object) -> str:
    return sha256_text(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False))


def decimal_value(token: str) -> Decimal:
    try:
        return Decimal(token.replace("D", "E").replace("d", "E"))
    except InvalidOperation as exc:
        raise ValueError(f"invalid real token: {token!r}") from exc


def numeric_lexeme(token: str) -> str:
    decimal_value(token)
    return token.replace("D", "E").replace("d", "E")


@dataclass(frozen=True)
class DataLine:
    number: int
    raw: str
    tokens: tuple[str, ...]


class QPLIBReader:
    def __init__(self, text: str) -> None:
        self._lines: list[DataLine] = []
        for number, raw in enumerate(text.splitlines(), 1):
            stripped = raw.strip()
            if not stripped or stripped[0] in "#!%":
                continue
            self._lines.append(DataLine(number, raw, tuple(stripped.split())))
        self._index = 0

    def next(self, label: str, arity: int = 1) -> DataLine:
        if self._index >= len(self._lines):
            raise ValueError(f"unexpected EOF while reading {label}")
        line = self._lines[self._index]
        self._index += 1
        if len(line.tokens) < arity:
            raise ValueError(f"line {line.number}: {label} requires {arity} values, got {len(line.tokens)}")
        return line

    def scalar(self, label: str) -> str:
        return self.next(label).tokens[0]

    def integer(self, label: str, *, minimum: int = 0) -> int:
        token = self.scalar(label)
        try:
            value = int(token)
        except ValueError as exc:
            raise ValueError(f"{label}: expected integer, got {token!r}") from exc
        if value < minimum:
            raise ValueError(f"{label}: expected >= {minimum}, got {value}")
        return value

    def real(self, label: str) -> str:
        return numeric_lexeme(self.scalar(label))

    def pairs(self, count: int, label: str) -> Iterator[tuple[int, str, str]]:
        for _ in range(count):
            line = self.next(label, 2)
            try:
                idx = int(line.tokens[0])
            except ValueError as exc:
                raise ValueError(f"line {line.number}: invalid index {line.tokens[0]!r}") from exc
            yield idx, numeric_lexeme(line.tokens[1]), line.raw

    def named_pairs(self, count: int, label: str) -> Iterator[tuple[int, str]]:
        for _ in range(count):
            line = self.next(label, 2)
            try:
                idx = int(line.tokens[0])
            except ValueError as exc:
                raise ValueError(f"line {line.number}: invalid index {line.tokens[0]!r}") from exc
            yield idx, line.tokens[1]

    def assert_exhausted(self) -> None:
        if self._index != len(self._lines):
            line = self._lines[self._index]
            raise ValueError(f"unexpected trailing data at line {line.number}: {line.raw!r}")


@dataclass
class ParsedModel:
    path: Path
    file_sha256: str
    name: str
    problem_type: str
    sense: str
    n: int
    m: int
    obj_q_count: int
    obj_linear_default: str
    obj_linear_override_count: int
    objective_constant: str
    constraint_q_count: int
    constraint_linear_count: int
    infinity_value: str
    constraint_lower_default: str | None
    constraint_upper_default: str | None
    conn: sqlite3.Connection

    @property
    def instance_url(self) -> str:
        if re.fullmatch(r"QPLIB_\d+", self.name):
            return f"https://qplib.zib.de/{self.name}.html"
        return SOURCE_POLICY_URL

    def close(self) -> None:
        self.conn.close()


def _validate_index(idx: int, upper: int, label: str) -> None:
    if not 1 <= idx <= upper:
        raise ValueError(f"{label}: index {idx} outside 1..{upper}")


def _insert_many(conn: sqlite3.Connection, sql: str, rows: Iterator[tuple], batch_size: int = 10_000) -> int:
    batch: list[tuple] = []
    count = 0
    for row in rows:
        batch.append(row)
        if len(batch) >= batch_size:
            conn.executemany(sql, batch)
            count += len(batch)
            batch.clear()
    if batch:
        conn.executemany(sql, batch)
        count += len(batch)
    return count


def parse_qplib(path: Path) -> ParsedModel:
    raw_bytes = path.read_bytes()
    try:
        text = raw_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw_bytes.decode("latin-1")
    reader = QPLIBReader(text)

    name = reader.scalar("problem name")
    problem_type = reader.scalar("problem type").upper()
    if not PROBLEM_TYPE_RE.fullmatch(problem_type):
        raise ValueError(f"unsupported/invalid QPLIB problem type: {problem_type!r}")
    sense = reader.scalar("objective sense").lower()
    if sense not in {"minimize", "maximize"}:
        raise ValueError(f"invalid objective sense: {sense!r}")

    objective_type, variable_type, constraint_type = problem_type
    n = reader.integer("number of variables", minimum=1)
    has_general_constraints = constraint_type not in {"N", "B"}
    m = reader.integer("number of constraints") if has_general_constraints else 0

    tmp = tempfile.NamedTemporaryFile(prefix="atlas-qplib-", suffix=".sqlite3", delete=False)
    tmp_path = Path(tmp.name)
    tmp.close()
    conn = sqlite3.connect(tmp_path)
    try:
        conn.execute("PRAGMA journal_mode=OFF")
        conn.execute("PRAGMA synchronous=OFF")
        conn.execute("PRAGMA temp_store=MEMORY")
        conn.executescript(
            """
            CREATE TABLE quad(scope INTEGER NOT NULL, seq INTEGER PRIMARY KEY AUTOINCREMENT, row_idx INTEGER NOT NULL, col_idx INTEGER NOT NULL, value TEXT NOT NULL);
            CREATE INDEX quad_scope_seq ON quad(scope, seq);
            CREATE TABLE linear(scope INTEGER NOT NULL, seq INTEGER PRIMARY KEY AUTOINCREMENT, col_idx INTEGER NOT NULL, value TEXT NOT NULL);
            CREATE INDEX linear_scope_seq ON linear(scope, seq);
            CREATE TABLE bounds(kind TEXT NOT NULL, idx INTEGER NOT NULL, value TEXT NOT NULL, PRIMARY KEY(kind, idx));
            CREATE TABLE names(kind TEXT NOT NULL, idx INTEGER NOT NULL, value TEXT NOT NULL, PRIMARY KEY(kind, idx));
            """
        )

        obj_q_count = 0
        if objective_type != "L":
            obj_q_count = reader.integer("number of quadratic terms in objective")

            def obj_q_rows() -> Iterator[tuple[int, int, int, str]]:
                for _ in range(obj_q_count):
                    line = reader.next("quadratic objective term", 3)
                    r, c = int(line.tokens[0]), int(line.tokens[1])
                    _validate_index(r, n, "objective quadratic row")
                    _validate_index(c, n, "objective quadratic column")
                    if r < c:
                        raise ValueError(f"line {line.number}: QPLIB lower triangle requires row >= column")
                    yield 0, r, c, numeric_lexeme(line.tokens[2])

            _insert_many(conn, "INSERT INTO quad(scope,row_idx,col_idx,value) VALUES (?,?,?,?)", obj_q_rows())

        obj_linear_default = reader.real("default linear objective coefficient")
        obj_linear_override_count = reader.integer("number of non-default linear objective coefficients")

        def obj_linear_rows() -> Iterator[tuple[int, int, str]]:
            for idx, value, _raw in reader.pairs(obj_linear_override_count, "linear objective override"):
                _validate_index(idx, n, "objective linear")
                yield 0, idx, value

        _insert_many(conn, "INSERT INTO linear(scope,col_idx,value) VALUES (?,?,?)", obj_linear_rows())
        objective_constant = reader.real("objective constant")

        constraint_q_count = 0
        if has_general_constraints and constraint_type != "L":
            constraint_q_count = reader.integer("number of quadratic terms in all constraints")

            def con_q_rows() -> Iterator[tuple[int, int, int, str]]:
                for _ in range(constraint_q_count):
                    line = reader.next("quadratic constraint term", 4)
                    i, r, c = int(line.tokens[0]), int(line.tokens[1]), int(line.tokens[2])
                    _validate_index(i, m, "constraint quadratic constraint")
                    _validate_index(r, n, "constraint quadratic row")
                    _validate_index(c, n, "constraint quadratic column")
                    if r < c:
                        raise ValueError(f"line {line.number}: QPLIB lower triangle requires row >= column")
                    yield i, r, c, numeric_lexeme(line.tokens[3])

            _insert_many(conn, "INSERT INTO quad(scope,row_idx,col_idx,value) VALUES (?,?,?,?)", con_q_rows())

        constraint_linear_count = 0
        if has_general_constraints:
            constraint_linear_count = reader.integer("number of linear terms in all constraints")

            def con_linear_rows() -> Iterator[tuple[int, int, str]]:
                for _ in range(constraint_linear_count):
                    line = reader.next("linear constraint term", 3)
                    i, j = int(line.tokens[0]), int(line.tokens[1])
                    _validate_index(i, m, "constraint linear constraint")
                    _validate_index(j, n, "constraint linear variable")
                    yield i, j, numeric_lexeme(line.tokens[2])

            _insert_many(conn, "INSERT INTO linear(scope,col_idx,value) VALUES (?,?,?)", con_linear_rows())

        infinity_value = reader.real("infinity value")
        if decimal_value(infinity_value) <= 0:
            raise ValueError("infinity value must be positive")

        constraint_lower_default = constraint_upper_default = None
        if has_general_constraints:
            constraint_lower_default = reader.real("default constraint lower bound")
            lower_count = reader.integer("number of non-default constraint lower bounds")
            for idx, value, _raw in reader.pairs(lower_count, "constraint lower bound override"):
                _validate_index(idx, m, "constraint lower bound")
                conn.execute("INSERT INTO bounds(kind,idx,value) VALUES ('cl',?,?)", (idx, value))

            constraint_upper_default = reader.real("default constraint upper bound")
            upper_count = reader.integer("number of non-default constraint upper bounds")
            for idx, value, _raw in reader.pairs(upper_count, "constraint upper bound override"):
                _validate_index(idx, m, "constraint upper bound")
                conn.execute("INSERT INTO bounds(kind,idx,value) VALUES ('cu',?,?)", (idx, value))

        if variable_type != "B":
            _lower_default = reader.real("default variable lower bound")
            lower_count = reader.integer("number of non-default variable lower bounds")
            for idx, _value, _raw in reader.pairs(lower_count, "variable lower bound override"):
                _validate_index(idx, n, "variable lower bound")

            _upper_default = reader.real("default variable upper bound")
            upper_count = reader.integer("number of non-default variable upper bounds")
            for idx, _value, _raw in reader.pairs(upper_count, "variable upper bound override"):
                _validate_index(idx, n, "variable upper bound")

        if variable_type not in {"C", "B", "I"}:
            default_var_type = reader.integer("default variable type")
            if default_var_type not in {0, 1, 2}:
                raise ValueError(f"invalid default variable type {default_var_type}")
            type_count = reader.integer("number of non-default variable types")
            for _ in range(type_count):
                line = reader.next("variable type override", 2)
                idx, kind = int(line.tokens[0]), int(line.tokens[1])
                _validate_index(idx, n, "variable type")
                if kind not in {0, 1, 2}:
                    raise ValueError(f"line {line.number}: invalid variable type {kind}")

        _x0_default = reader.real("default variable primal start")
        x0_count = reader.integer("number of non-default variable primal starts")
        for idx, _value, _raw in reader.pairs(x0_count, "variable primal start override"):
            _validate_index(idx, n, "variable primal start")

        if has_general_constraints:
            _y0_default = reader.real("default constraint dual start")
            y0_count = reader.integer("number of non-default constraint dual starts")
            for idx, _value, _raw in reader.pairs(y0_count, "constraint dual start override"):
                _validate_index(idx, m, "constraint dual start")

        _z0_default = reader.real("default variable bound dual start")
        z0_count = reader.integer("number of non-default variable bound dual starts")
        for idx, _value, _raw in reader.pairs(z0_count, "variable bound dual start override"):
            _validate_index(idx, n, "variable bound dual start")

        variable_name_count = reader.integer("number of non-default variable names")
        for idx, value in reader.named_pairs(variable_name_count, "variable name"):
            _validate_index(idx, n, "variable name")
            conn.execute("INSERT INTO names(kind,idx,value) VALUES ('var',?,?)", (idx, value))

        constraint_name_count = reader.integer("number of non-default constraint names")
        for idx, value in reader.named_pairs(constraint_name_count, "constraint name"):
            if not has_general_constraints:
                raise ValueError("constraint names are invalid when m=0")
            _validate_index(idx, m, "constraint name")
            conn.execute("INSERT INTO names(kind,idx,value) VALUES ('con',?,?)", (idx, value))

        reader.assert_exhausted()
        conn.commit()
        return ParsedModel(
            path=path,
            file_sha256=sha256_bytes(raw_bytes),
            name=name,
            problem_type=problem_type,
            sense=sense,
            n=n,
            m=m,
            obj_q_count=obj_q_count,
            obj_linear_default=obj_linear_default,
            obj_linear_override_count=obj_linear_override_count,
            objective_constant=objective_constant,
            constraint_q_count=constraint_q_count,
            constraint_linear_count=constraint_linear_count,
            infinity_value=infinity_value,
            constraint_lower_default=constraint_lower_default,
            constraint_upper_default=constraint_upper_default,
            conn=conn,
        )
    except Exception:
        conn.close()
        tmp_path.unlink(missing_ok=True)
        raise


def _render_quadratic(rows: Iterator[tuple[int, int, str]]) -> tuple[str, int]:
    out = io.StringIO()
    count = 0
    for r, c, value in rows:
        if count:
            out.write(" + ")
        out.write(f"({value})*x_{r}*x_{c}")
        count += 1
    return out.getvalue(), count


def _render_linear(rows: Iterator[tuple[int, str]]) -> tuple[str, int]:
    out = io.StringIO()
    count = 0
    for j, value in rows:
        if count:
            out.write(" + ")
        out.write(f"({value})*x_{j}")
        count += 1
    return out.getvalue(), count


def _objective_linear(model: ParsedModel) -> tuple[str, int]:
    overrides = model.conn.execute("SELECT col_idx,value FROM linear WHERE scope=0 ORDER BY col_idx")
    default = decimal_value(model.obj_linear_default)
    if default == 0:
        return _render_linear((int(j), str(value)) for j, value in overrides)

    out = io.StringIO()
    next_override = next(overrides, None)
    count = 0
    for j in range(1, model.n + 1):
        value = model.obj_linear_default
        if next_override is not None and int(next_override[0]) == j:
            value = str(next_override[1])
            next_override = next(overrides, None)
        if decimal_value(value) == 0:
            continue
        if count:
            out.write(" + ")
        out.write(f"({value})*x_{j}")
        count += 1
    return out.getvalue(), count


def _join_body(q_text: str, linear_text: str, constant: str | None = None) -> str:
    pieces: list[str] = []
    if q_text:
        pieces.append(f"1/2*({q_text})")
    if linear_text:
        pieces.append(linear_text)
    if constant is not None and decimal_value(constant) != 0:
        pieces.append(f"({constant})")
    return " + ".join(pieces) if pieces else "0"


class GroupStream:
    def __init__(self, cursor: sqlite3.Cursor, quadratic: bool) -> None:
        self.cursor = iter(cursor)
        self.quadratic = quadratic
        self.current = next(self.cursor, None)

    def consume(self, scope: int) -> tuple[str, int]:
        out = io.StringIO()
        count = 0
        while self.current is not None and int(self.current[0]) < scope:
            raise ValueError(f"internal term ordering error before scope {scope}")
        while self.current is not None and int(self.current[0]) == scope:
            if count:
                out.write(" + ")
            if self.quadratic:
                _s, r, c, value = self.current
                out.write(f"({value})*x_{r}*x_{c}")
            else:
                _s, j, value = self.current
                out.write(f"({value})*x_{j}")
            count += 1
            self.current = next(self.cursor, None)
        return out.getvalue(), count


class SparseValueStream:
    def __init__(self, cursor: sqlite3.Cursor) -> None:
        self.cursor = iter(cursor)
        self.current = next(self.cursor, None)

    def value(self, idx: int, default: str) -> str:
        while self.current is not None and int(self.current[0]) < idx:
            raise ValueError(f"internal sparse value ordering error before index {idx}")
        if self.current is not None and int(self.current[0]) == idx:
            value = str(self.current[1])
            self.current = next(self.cursor, None)
            return value
        return default


class SparseNameStream:
    def __init__(self, cursor: sqlite3.Cursor) -> None:
        self.cursor = iter(cursor)
        self.current = next(self.cursor, None)

    def value(self, idx: int) -> str | None:
        while self.current is not None and int(self.current[0]) < idx:
            raise ValueError(f"internal sparse name ordering error before index {idx}")
        if self.current is not None and int(self.current[0]) == idx:
            value = str(self.current[1])
            self.current = next(self.cursor, None)
            return value
        return None


def _bound_is_infinite(value: str, infinity_value: str, *, lower: bool) -> bool:
    v = decimal_value(value)
    inf = abs(decimal_value(infinity_value))
    return v <= -inf if lower else v >= inf


def _occurrence(model: ParsedModel, snapshot: str, kind: str, index: int | None, expression: str, payload: dict) -> dict:
    locator = "objective" if kind == "objective" else f"constraint:{index}"
    record_identity = {
        "problem": model.name,
        "problem_type": model.problem_type,
        "source_file_sha256": model.file_sha256,
        "kind": kind,
        "index": index,
        "reconstructed_expression": expression,
    }
    return {
        "schema_version": 1,
        "source_id": SOURCE_ID,
        "source_snapshot": snapshot,
        "provenance_class": "reconstructed",
        "expression_original": None,
        "expression_reconstructed": expression,
        "expression_encoding": "QPLIB-native-sparse-coefficients-to-ascii-v1",
        "expression_sha256": sha256_text(expression),
        "normalized_text": " ".join(expression.split()),
        "normalized_text_sha256": sha256_text(" ".join(expression.split())),
        "source_record_sha256": sha256_json(record_identity),
        "source_document_id": model.name,
        "source_document_url": model.instance_url,
        "source_locator": f"{model.name}#{locator}",
        "source_license": SOURCE_LICENSE,
        "source_license_url": SOURCE_LICENSE_URL,
        "source_policy_url": SOURCE_POLICY_URL,
        "source_format_documentation_url": SOURCE_DOC_URL,
        "source_file_sha256": model.file_sha256,
        "source_attested_payload": payload,
        "reconstruction": {
            "rule": "qplib-native-sparse-model-v1",
            "definition": "Apply QPLIB's documented model semantics: sense 1/2*x^T*Q*x + b*x + q0, with lower-triangle Q entries, sparse linear coefficients, and documented constraint bounds.",
            "source_formula_is_explicit_in_instance": False,
            "faithfulness": "All coefficients and bounds are copied from the native QPLIB encoding; no optimization, simplification, OCR, or inferred coefficient is introduced.",
        },
    }


def iter_occurrences(model: ParsedModel, snapshot: str) -> Iterator[dict]:
    q_text, q_count = _render_quadratic(
        (int(r), int(c), str(value))
        for r, c, value in model.conn.execute("SELECT row_idx,col_idx,value FROM quad WHERE scope=0 ORDER BY seq")
    )
    linear_text, linear_count = _objective_linear(model)
    body = _join_body(q_text, linear_text, model.objective_constant)
    objective_expression = f"{model.sense} f(x) := {body}"
    yield _occurrence(
        model,
        snapshot,
        "objective",
        None,
        objective_expression,
        {
            "representation": "QPLIB native sparse coefficient model",
            "problem_name": model.name,
            "problem_type": model.problem_type,
            "sense": model.sense,
            "n_variables": model.n,
            "n_constraints": model.m,
            "objective_quadratic_terms": q_count,
            "objective_linear_terms_after_default_expansion": linear_count,
            "objective_linear_default": model.obj_linear_default,
            "objective_linear_overrides": model.obj_linear_override_count,
            "objective_constant": model.objective_constant,
            "source_file_sha256": model.file_sha256,
        },
    )

    if model.m == 0:
        return

    q_stream = GroupStream(
        model.conn.execute("SELECT scope,row_idx,col_idx,value FROM quad WHERE scope>0 ORDER BY scope,seq"),
        quadratic=True,
    )
    linear_stream = GroupStream(
        model.conn.execute("SELECT scope,col_idx,value FROM linear WHERE scope>0 ORDER BY scope,seq"),
        quadratic=False,
    )
    lower_stream = SparseValueStream(model.conn.execute("SELECT idx,value FROM bounds WHERE kind='cl' ORDER BY idx"))
    upper_stream = SparseValueStream(model.conn.execute("SELECT idx,value FROM bounds WHERE kind='cu' ORDER BY idx"))
    name_stream = SparseNameStream(model.conn.execute("SELECT idx,value FROM names WHERE kind='con' ORDER BY idx"))
    assert model.constraint_lower_default is not None and model.constraint_upper_default is not None

    for i in range(1, model.m + 1):
        q_text, q_count = q_stream.consume(i)
        linear_text, linear_count = linear_stream.consume(i)
        body = _join_body(q_text, linear_text)
        lower = lower_stream.value(i, model.constraint_lower_default)
        upper = upper_stream.value(i, model.constraint_upper_default)
        lower_inf = _bound_is_infinite(lower, model.infinity_value, lower=True)
        upper_inf = _bound_is_infinite(upper, model.infinity_value, lower=False)
        if lower_inf and upper_inf:
            expression = f"constraint_{i}(x) := {body}"
        elif lower_inf:
            expression = f"{body} <= {upper}"
        elif upper_inf:
            expression = f"{lower} <= {body}"
        else:
            expression = f"{lower} <= {body} <= {upper}"
        constraint_name = name_stream.value(i)
        yield _occurrence(
            model,
            snapshot,
            "constraint",
            i,
            expression,
            {
                "representation": "QPLIB native sparse coefficient model",
                "problem_name": model.name,
                "problem_type": model.problem_type,
                "constraint_index": i,
                "constraint_name": constraint_name,
                "n_variables": model.n,
                "quadratic_terms": q_count,
                "linear_terms": linear_count,
                "lower_bound": lower,
                "upper_bound": upper,
                "infinity_value": model.infinity_value,
                "source_file_sha256": model.file_sha256,
            },
        )


def iter_input_files(input_path: Path) -> Iterator[Path]:
    if input_path.is_file():
        yield input_path
        return
    if not input_path.is_dir():
        raise ValueError(f"input path does not exist: {input_path}")
    yield from sorted(path for path in input_path.rglob("*.qplib") if path.is_file())


def harvest(input_path: Path, output: TextIO, snapshot: str, limit_records: int | None) -> dict[str, int]:
    files_seen = files_rejected = objectives = constraints = records = 0
    for path in iter_input_files(input_path):
        if limit_records is not None and records >= limit_records:
            break
        files_seen += 1
        model: ParsedModel | None = None
        try:
            model = parse_qplib(path)
            for row in iter_occurrences(model, snapshot):
                if limit_records is not None and records >= limit_records:
                    break
                output.write(json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n")
                records += 1
                if row["source_locator"].endswith("#objective"):
                    objectives += 1
                else:
                    constraints += 1
        except Exception as exc:  # noqa: BLE001
            files_rejected += 1
            print(json.dumps({"event": "source-rejected", "file": path.name, "error": str(exc)}, sort_keys=True), file=sys.stderr)
        finally:
            if model is not None:
                db_path = Path(model.conn.execute("PRAGMA database_list").fetchone()[2])
                model.close()
                db_path.unlink(missing_ok=True)
    return {
        "files_seen": files_seen,
        "files_rejected": files_rejected,
        "objectives_emitted": objectives,
        "constraints_emitted": constraints,
        "records_emitted": records,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="QPLIB .qplib file or directory tree")
    parser.add_argument("--snapshot", required=True, help="Exact snapshot id, preferably qplib:inventory-sha256:<digest>")
    parser.add_argument("--limit-records", type=int)
    args = parser.parse_args()
    if args.limit_records is not None and args.limit_records < 1:
        parser.error("--limit-records must be positive")

    metrics = harvest(args.input, sys.stdout, args.snapshot, args.limit_records)
    print(json.dumps({"event": "harvest-complete", "source_id": SOURCE_ID, **metrics}, sort_keys=True), file=sys.stderr)
    return 0 if metrics["files_rejected"] == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
