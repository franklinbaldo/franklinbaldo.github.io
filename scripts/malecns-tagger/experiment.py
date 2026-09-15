# /// script
# requires-python = ">=3.11"
# dependencies = [
#   "numpy>=2.0",
#   "pyarrow>=19.0",
#   "torch>=2.6",
# ]
# ///
"""MaleCNS byte-level sequence tagging experiment.

The biological connectome supplies topology only. The rate dynamics, text input
mapping and tag readout are engineered experimental choices, not a claim of a
literal fly-brain emulation.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import shutil
import sys
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader, Dataset

PAD_BYTE = 256
IGNORE_LABEL = -100
CAUSAGANHA_COMMIT = "7c3d6557bb692932553622ae6e00493ba04e534f"
CAUSAGANHA_BASE = (
    "https://raw.githubusercontent.com/franklinbaldo/causaganha/"
    f"{CAUSAGANHA_COMMIT}/data/segmenter_splits"
)
MALECNS_SOURCES = {
    "annotations.feather": {
        "url": "https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/body-annotations-male-cns-v1.0-minconf-0.5.feather",
        "bytes": 14_483_314,
        "sha256": "2177e246113e4cfbf1e7772ec37c6da1955ff22e8063d0b1f833101f99a9a3b2",
    },
    "edges.feather": {
        "url": "https://storage.googleapis.com/flyem-male-cns/v1.0/connectome-data/flat-connectome/connectome-weights-male-cns-v1.0-minconf-0.5.feather",
        "bytes": 1_051_241_946,
        "sha256": "e35da783d1c686b2b58b3b87cd6a403ae43bfcfba8bff28e08ef752c1a56afc1",
    },
}


@dataclass(frozen=True)
class Config:
    seed: int = 20260912
    nodes: int = 512
    input_nodes: int = 64
    embedding_dim: int = 64
    chunk_bytes: int = 192
    negatives_per_positive: int = 2
    epochs: int = 3
    batch_size: int = 4
    learning_rate: float = 3e-3
    baseline_learning_rate: float = 1e-2
    leak: float = 0.35
    recurrent_gain: float = 0.9
    input_gain: float = 0.5
    max_train_docs: int = 0
    max_val_docs: int = 0
    label: str = "resultado"


def seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while chunk := stream.read(8 * 1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def download(
    url: str,
    destination: Path,
    *,
    sha256: str | None = None,
    expected_bytes: int | None = None,
) -> Path:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        good_size = expected_bytes is None or destination.stat().st_size == expected_bytes
        good_hash = sha256 is None or sha256_file(destination) == sha256
        if good_size and good_hash:
            return destination
        destination.unlink()
    partial = destination.with_suffix(destination.suffix + ".partial")
    if partial.exists():
        partial.unlink()
    print(f"download: {url}", flush=True)
    with urllib.request.urlopen(url) as response, partial.open("wb") as output:
        shutil.copyfileobj(response, output, length=8 * 1024 * 1024)
    if expected_bytes is not None and partial.stat().st_size != expected_bytes:
        partial.unlink(missing_ok=True)
        raise RuntimeError(f"size mismatch for {destination.name}")
    if sha256 is not None and sha256_file(partial) != sha256:
        partial.unlink(missing_ok=True)
        raise RuntimeError(f"sha256 mismatch for {destination.name}")
    partial.replace(destination)
    return destination


def char_span_to_byte_span(text: str, start: int, end: int) -> tuple[int, int]:
    """Map Python character offsets to UTF-8 byte offsets without lossy decoding."""
    if not 0 <= start <= end <= len(text):
        raise ValueError(f"invalid character span: {(start, end)} for len={len(text)}")
    return len(text[:start].encode("utf-8")), len(text[:end].encode("utf-8"))


def encode_binary_labels(record: dict, label: str) -> tuple[np.ndarray, np.ndarray]:
    text = record["text"]
    raw = np.frombuffer(text.encode("utf-8"), dtype=np.uint8).astype(np.int64)
    labels = np.zeros(len(raw), dtype=np.int64)
    for span in record.get("label", []):
        if span.get("category") != label:
            continue
        start, end = char_span_to_byte_span(text, int(span["start"]), int(span["end"]))
        labels[start:end] = 1
    return raw, labels


def read_jsonl(path: Path, max_docs: int = 0) -> list[dict]:
    records: list[dict] = []
    with path.open(encoding="utf-8") as stream:
        for line in stream:
            if line.strip():
                records.append(json.loads(line))
                if max_docs and len(records) >= max_docs:
                    break
    return records


def choose_negative_starts(
    labels: np.ndarray, chunk_bytes: int, count: int, rng: random.Random
) -> list[int]:
    if len(labels) <= chunk_bytes:
        return [0] if not labels.any() and count else []
    candidates = []
    for start in range(0, len(labels) - chunk_bytes + 1, max(16, chunk_bytes // 4)):
        if not labels[start : start + chunk_bytes].any():
            candidates.append(start)
    rng.shuffle(candidates)
    return candidates[:count]


def make_windows(
    records: Iterable[dict], config: Config, *, split_seed: int
) -> list[tuple[np.ndarray, np.ndarray]]:
    rng = random.Random(split_seed)
    windows: list[tuple[np.ndarray, np.ndarray]] = []
    for record in records:
        tokens, labels = encode_binary_labels(record, config.label)
        positives = np.flatnonzero(labels)
        starts: list[int] = []
        if len(positives):
            first, last = int(positives[0]), int(positives[-1]) + 1
            center = (first + last) // 2
            start = max(
                0,
                min(
                    center - config.chunk_bytes // 2,
                    max(0, len(tokens) - config.chunk_bytes),
                ),
            )
            starts.append(start)
            starts.extend(
                choose_negative_starts(
                    labels,
                    config.chunk_bytes,
                    config.negatives_per_positive,
                    rng,
                )
            )
        else:
            starts.extend(choose_negative_starts(labels, config.chunk_bytes, 1, rng))
        for start in starts:
            token_chunk = tokens[start : start + config.chunk_bytes]
            label_chunk = labels[start : start + config.chunk_bytes]
            if len(token_chunk) < config.chunk_bytes:
                pad = config.chunk_bytes - len(token_chunk)
                token_chunk = np.pad(token_chunk, (0, pad), constant_values=PAD_BYTE)
                label_chunk = np.pad(label_chunk, (0, pad), constant_values=IGNORE_LABEL)
            windows.append((token_chunk, label_chunk))
    rng.shuffle(windows)
    return windows


class WindowDataset(Dataset):
    def __init__(self, windows: list[tuple[np.ndarray, np.ndarray]]) -> None:
        self.windows = windows

    def __len__(self) -> int:
        return len(self.windows)

    def __getitem__(self, index: int) -> tuple[torch.Tensor, torch.Tensor]:
        tokens, labels = self.windows[index]
        return torch.from_numpy(tokens.copy()).long(), torch.from_numpy(labels.copy()).long()


def _map_retained(ids: np.ndarray, values: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    positions = np.searchsorted(ids, values)
    in_bounds = positions < len(ids)
    safe = np.minimum(positions, len(ids) - 1)
    keep = in_bounds & (ids[safe] == values)
    return positions, keep


def build_malecns_subgraph(cache_dir: Path, n_nodes: int) -> dict[str, np.ndarray]:
    """Build a deterministic high-degree MaleCNS subgraph from official flat files."""
    import pyarrow as pa
    import pyarrow.feather as feather
    import pyarrow.ipc as ipc

    source_dir = cache_dir / "malecns-v1"
    source_dir.mkdir(parents=True, exist_ok=True)
    for filename, spec in MALECNS_SOURCES.items():
        download(
            spec["url"],
            source_dir / filename,
            sha256=spec["sha256"],
            expected_bytes=spec["bytes"],
        )

    cache_path = source_dir / f"subgraph-top-degree-{n_nodes}.npz"
    if cache_path.exists():
        with np.load(cache_path) as data:
            return {key: data[key] for key in data.files}

    annotations = feather.read_table(
        source_dir / "annotations.feather", columns=["bodyId", "superclass", "status"]
    )
    body_ids = annotations["bodyId"].to_numpy(zero_copy_only=False).astype(np.uint64)
    superclasses = annotations["superclass"].to_pylist()
    statuses = annotations["status"].to_pylist()
    retain = np.asarray(
        [
            superclass not in (None, "") and status != "Glia"
            for superclass, status in zip(superclasses, statuses, strict=True)
        ],
        dtype=bool,
    )
    ids = np.sort(body_ids[retain])
    if n_nodes > len(ids):
        raise ValueError(f"requested {n_nodes} nodes from only {len(ids)} retained neurons")

    edge_path = source_dir / "edges.feather"
    reader = ipc.open_file(pa.memory_map(str(edge_path), "r"))
    degree = np.zeros(len(ids), dtype=np.float64)
    for number in range(reader.num_record_batches):
        batch = reader.get_batch(number)
        cols = {
            name: batch.column(batch.schema.get_field_index(name)).to_numpy(
                zero_copy_only=False
            )
            for name in ("body_pre", "body_post", "weight")
        }
        pre = cols["body_pre"].astype(np.uint64, copy=False)
        post = cols["body_post"].astype(np.uint64, copy=False)
        weight = cols["weight"].astype(np.float64, copy=False)
        i, keep_i = _map_retained(ids, pre)
        j, keep_j = _map_retained(ids, post)
        keep = keep_i & keep_j
        np.add.at(degree, i[keep], weight[keep])
        np.add.at(degree, j[keep], weight[keep])

    order = np.lexsort((ids, -degree))
    selected_global = np.sort(order[:n_nodes])
    selected_ids = ids[selected_global]
    local = np.full(len(ids), -1, dtype=np.int32)
    local[selected_global] = np.arange(n_nodes, dtype=np.int32)

    pre_parts: list[np.ndarray] = []
    post_parts: list[np.ndarray] = []
    weight_parts: list[np.ndarray] = []
    for number in range(reader.num_record_batches):
        batch = reader.get_batch(number)
        cols = {
            name: batch.column(batch.schema.get_field_index(name)).to_numpy(
                zero_copy_only=False
            )
            for name in ("body_pre", "body_post", "weight")
        }
        pre = cols["body_pre"].astype(np.uint64, copy=False)
        post = cols["body_post"].astype(np.uint64, copy=False)
        weight = cols["weight"].astype(np.float64, copy=False)
        i, keep_i = _map_retained(ids, pre)
        j, keep_j = _map_retained(ids, post)
        keep = keep_i & keep_j
        if not np.any(keep):
            continue
        i = i[keep]
        j = j[keep]
        weight = weight[keep]
        li = local[i]
        lj = local[j]
        inside = (li >= 0) & (lj >= 0)
        if np.any(inside):
            pre_parts.append(li[inside].astype(np.int64))
            post_parts.append(lj[inside].astype(np.int64))
            weight_parts.append(weight[inside].astype(np.float32))

    if not pre_parts:
        raise RuntimeError("selected MaleCNS subgraph has no internal edges")
    pre = np.concatenate(pre_parts)
    post = np.concatenate(post_parts)
    raw_weight = np.concatenate(weight_parts)
    incoming = np.bincount(post, weights=raw_weight, minlength=n_nodes).astype(np.float32)
    normalized = raw_weight / np.maximum(incoming[post], 1.0)
    result = {
        "pre": pre,
        "post": post,
        "weight": normalized.astype(np.float32),
        "source_id": selected_ids.astype(np.uint64),
        "weighted_degree": degree[selected_global].astype(np.float64),
    }
    np.savez_compressed(cache_path, **result)
    return result


def synthetic_subgraph(n_nodes: int, seed: int) -> dict[str, np.ndarray]:
    rng = np.random.default_rng(seed)
    pre: list[int] = []
    post: list[int] = []
    weights: list[float] = []
    for i in range(n_nodes):
        for offset, weight in ((1, 0.55), (2, 0.25), (7, 0.20)):
            pre.append(i)
            post.append((i + offset) % n_nodes)
            weights.append(weight)
        target = int(rng.integers(0, n_nodes))
        pre.append(i)
        post.append(target)
        weights.append(0.15)
    pre_a = np.asarray(pre, dtype=np.int64)
    post_a = np.asarray(post, dtype=np.int64)
    weight_a = np.asarray(weights, dtype=np.float32)
    incoming = np.bincount(post_a, weights=weight_a, minlength=n_nodes).astype(np.float32)
    weight_a /= np.maximum(incoming[post_a], 1e-6)
    return {
        "pre": pre_a,
        "post": post_a,
        "weight": weight_a,
        "source_id": np.arange(n_nodes, dtype=np.uint64),
        "weighted_degree": np.ones(n_nodes, dtype=np.float64),
    }


def sparse_matrix(graph: dict[str, np.ndarray], device: torch.device) -> torch.Tensor:
    n_nodes = len(graph["source_id"])
    indices = torch.from_numpy(np.stack([graph["post"], graph["pre"]])).long()
    values = torch.from_numpy(graph["weight"]).float()
    return torch.sparse_coo_tensor(
        indices, values, (n_nodes, n_nodes), device=device
    ).coalesce()


class MaleCNSReservoirTagger(nn.Module):
    def __init__(
        self, graph: dict[str, np.ndarray], config: Config, device: torch.device
    ) -> None:
        super().__init__()
        n_nodes = len(graph["source_id"])
        if config.input_nodes > n_nodes:
            raise ValueError("input_nodes cannot exceed reservoir node count")
        self.embedding = nn.Embedding(
            PAD_BYTE + 1, config.embedding_dim, padding_idx=PAD_BYTE
        )
        self.input_projection = nn.Linear(config.embedding_dim, config.input_nodes)
        self.readout = nn.Linear(n_nodes, 2)
        generator = torch.Generator().manual_seed(config.seed)
        input_nodes = torch.randperm(n_nodes, generator=generator)[: config.input_nodes]
        self.register_buffer("input_node_indices", input_nodes, persistent=True)
        self.register_buffer(
            "recurrent", sparse_matrix(graph, device), persistent=False
        )
        self.leak = config.leak
        self.recurrent_gain = config.recurrent_gain
        self.input_gain = config.input_gain
        self.to(device)

    def forward(self, tokens: torch.Tensor) -> torch.Tensor:
        batch, steps = tokens.shape
        n_nodes = self.readout.in_features
        state = torch.zeros(batch, n_nodes, device=tokens.device)
        embedded = self.embedding(tokens)
        drives = self.input_projection(embedded)
        outputs = []
        for t in range(steps):
            recurrent = torch.sparse.mm(self.recurrent, state.T).T
            injected = torch.zeros_like(state)
            injected[:, self.input_node_indices] = drives[:, t] * self.input_gain
            candidate = torch.tanh(self.recurrent_gain * recurrent + injected)
            state = (1.0 - self.leak) * state + self.leak * candidate
            outputs.append(self.readout(state))
        return torch.stack(outputs, dim=1)


class ByteOnlyBaseline(nn.Module):
    def __init__(self, embedding_dim: int) -> None:
        super().__init__()
        self.embedding = nn.Embedding(
            PAD_BYTE + 1, embedding_dim, padding_idx=PAD_BYTE
        )
        self.readout = nn.Linear(embedding_dim, 2)

    def forward(self, tokens: torch.Tensor) -> torch.Tensor:
        return self.readout(self.embedding(tokens))


def class_weights(dataset: WindowDataset, device: torch.device) -> torch.Tensor:
    positive = 0
    negative = 0
    for _, labels in dataset.windows:
        positive += int(np.count_nonzero(labels == 1))
        negative += int(np.count_nonzero(labels == 0))
    if positive == 0:
        return torch.tensor([1.0, 1.0], device=device)
    ratio = min(20.0, max(1.0, negative / positive))
    return torch.tensor([1.0, ratio], dtype=torch.float32, device=device)


def metrics_from_counts(tp: int, fp: int, fn: int, tn: int) -> dict[str, float | int]:
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    accuracy = (tp + tn) / max(1, tp + fp + fn + tn)
    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "accuracy": accuracy,
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn,
    }


@torch.no_grad()
def evaluate(
    model: nn.Module, loader: DataLoader, device: torch.device
) -> dict[str, float | int]:
    model.eval()
    tp = fp = fn = tn = 0
    for tokens, labels in loader:
        tokens, labels = tokens.to(device), labels.to(device)
        predictions = model(tokens).argmax(dim=-1)
        valid = labels != IGNORE_LABEL
        truth = labels[valid]
        pred = predictions[valid]
        tp += int(((pred == 1) & (truth == 1)).sum())
        fp += int(((pred == 1) & (truth == 0)).sum())
        fn += int(((pred == 0) & (truth == 1)).sum())
        tn += int(((pred == 0) & (truth == 0)).sum())
    return metrics_from_counts(tp, fp, fn, tn)


def train_model(
    model: nn.Module,
    train_loader: DataLoader,
    val_loader: DataLoader,
    dataset: WindowDataset,
    *,
    epochs: int,
    learning_rate: float,
    device: torch.device,
) -> list[dict]:
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    loss_fn = nn.CrossEntropyLoss(
        weight=class_weights(dataset, device), ignore_index=IGNORE_LABEL
    )
    history = []
    for epoch in range(1, epochs + 1):
        model.train()
        running = 0.0
        batches = 0
        for tokens, labels in train_loader:
            tokens, labels = tokens.to(device), labels.to(device)
            optimizer.zero_grad(set_to_none=True)
            logits = model(tokens)
            loss = loss_fn(logits.reshape(-1, 2), labels.reshape(-1))
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            running += float(loss.detach())
            batches += 1
        val = evaluate(model, val_loader, device)
        row = {
            "epoch": epoch,
            "train_loss": running / max(1, batches),
            "validation": val,
        }
        history.append(row)
        print(json.dumps(row, ensure_ascii=False), flush=True)
    return history


def prepare_causaganha(work_dir: Path) -> tuple[Path, Path]:
    data_dir = work_dir / "causaganha"
    train = download(f"{CAUSAGANHA_BASE}/train.jsonl", data_dir / "train.jsonl")
    val = download(f"{CAUSAGANHA_BASE}/val.jsonl", data_dir / "val.jsonl")
    return train, val


def run_experiment(args: argparse.Namespace) -> int:
    config = Config(
        seed=args.seed,
        nodes=args.nodes,
        input_nodes=args.input_nodes,
        embedding_dim=64,
        chunk_bytes=args.chunk_bytes,
        negatives_per_positive=args.negatives_per_positive,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.learning_rate,
        baseline_learning_rate=args.baseline_learning_rate,
        leak=args.leak,
        recurrent_gain=args.recurrent_gain,
        input_gain=args.input_gain,
        max_train_docs=args.max_train_docs,
        max_val_docs=args.max_val_docs,
        label="resultado",
    )
    seed_everything(config.seed)
    output_dir = Path(args.output_dir)
    work_dir = Path(args.work_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    work_dir.mkdir(parents=True, exist_ok=True)

    train_path, val_path = prepare_causaganha(work_dir)
    train_records = read_jsonl(train_path, config.max_train_docs)
    val_records = read_jsonl(val_path, config.max_val_docs)
    train_windows = make_windows(train_records, config, split_seed=config.seed)
    val_windows = make_windows(val_records, config, split_seed=config.seed + 1)
    if not train_windows or not val_windows:
        raise RuntimeError("training/validation windows are empty")
    train_dataset = WindowDataset(train_windows)
    val_dataset = WindowDataset(val_windows)
    train_loader = DataLoader(
        train_dataset, batch_size=config.batch_size, shuffle=True
    )
    val_loader = DataLoader(val_dataset, batch_size=config.batch_size, shuffle=False)

    if args.graph == "malecns":
        graph = build_malecns_subgraph(work_dir / "connectome", config.nodes)
    else:
        graph = synthetic_subgraph(config.nodes, config.seed)

    device = torch.device(
        "cuda" if torch.cuda.is_available() and not args.cpu else "cpu"
    )
    print(
        f"device={device} graph={args.graph} nodes={config.nodes} edges={len(graph['pre'])}",
        flush=True,
    )

    fly = MaleCNSReservoirTagger(graph, config, device)
    fly_history = train_model(
        fly,
        train_loader,
        val_loader,
        train_dataset,
        epochs=config.epochs,
        learning_rate=config.learning_rate,
        device=device,
    )
    fly_final = evaluate(fly, val_loader, device)

    seed_everything(config.seed)
    baseline = ByteOnlyBaseline(config.embedding_dim).to(device)
    baseline_history = train_model(
        baseline,
        train_loader,
        val_loader,
        train_dataset,
        epochs=config.epochs,
        learning_rate=config.baseline_learning_rate,
        device=device,
    )
    baseline_final = evaluate(baseline, val_loader, device)

    trivial = metrics_from_counts(
        0,
        0,
        sum(int(np.count_nonzero(labels == 1)) for _, labels in val_windows),
        sum(int(np.count_nonzero(labels == 0)) for _, labels in val_windows),
    )
    report = {
        "experiment": "malecns-byte-tagger-mvp-v1",
        "config": asdict(config),
        "graph": {
            "kind": args.graph,
            "nodes": len(graph["source_id"]),
            "edges": len(graph["pre"]),
            "selection": (
                "top weighted degree within retained MaleCNS v1.0 neurons"
                if args.graph == "malecns"
                else "synthetic deterministic ring-plus-long-edge"
            ),
            "weights": "incoming-normalized synaptic contact counts; topology/weights frozen",
        },
        "sources": {
            "malecns_v1": MALECNS_SOURCES if args.graph == "malecns" else None,
            "causaganha_commit": CAUSAGANHA_COMMIT,
        },
        "data": {
            "causaganha_commit": CAUSAGANHA_COMMIT,
            "train_docs": len(train_records),
            "val_docs": len(val_records),
            "train_windows": len(train_windows),
            "val_windows": len(val_windows),
            "label": config.label,
            "encoding": "UTF-8 bytes",
        },
        "device": str(device),
        "results": {
            "malecns_reservoir": {"final": fly_final, "history": fly_history},
            "byte_only_baseline": {
                "final": baseline_final,
                "history": baseline_history,
            },
            "all_O_trivial": {"final": trivial},
        },
        "claim_boundary": (
            "This tests an engineered rate reservoir constrained by MaleCNS topology. "
            "It does not test a biologically faithful fly-brain simulation."
        ),
    }
    (output_dir / "metrics.json").write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    torch.save(
        {
            "config": asdict(config),
            "model_state": fly.state_dict(),
            "graph_source_ids": graph["source_id"],
            "graph_pre": graph["pre"],
            "graph_post": graph["post"],
            "graph_weight": graph["weight"],
        },
        output_dir / "checkpoint.pt",
    )
    print(json.dumps(report["results"], indent=2), flush=True)
    return 0


def self_test() -> int:
    seed_everything(7)
    text = "ação RESULTADO ok"
    start = text.index("RESULTADO")
    end = start + len("RESULTADO")
    record = {
        "text": text,
        "label": [{"category": "resultado", "start": start, "end": end}],
    }
    tokens, labels = encode_binary_labels(record, "resultado")
    byte_start, byte_end = char_span_to_byte_span(text, start, end)
    assert labels.sum() == byte_end - byte_start == len(b"RESULTADO")
    assert len(tokens) == len(text.encode("utf-8"))

    config = Config(
        nodes=24,
        input_nodes=8,
        embedding_dim=64,
        chunk_bytes=16,
        epochs=1,
        batch_size=2,
    )
    graph = synthetic_subgraph(config.nodes, config.seed)
    device = torch.device("cpu")
    model = MaleCNSReservoirTagger(graph, config, device)
    sample = torch.randint(0, 256, (2, 16))
    truth = torch.randint(0, 2, (2, 16))
    logits = model(sample)
    assert logits.shape == (2, 16, 2)
    loss = nn.CrossEntropyLoss()(logits.reshape(-1, 2), truth.reshape(-1))
    loss.backward()
    assert model.embedding.weight.grad is not None
    assert torch.isfinite(model.embedding.weight.grad).all()
    baseline = ByteOnlyBaseline(64)
    assert baseline(sample).shape == (2, 16, 2)
    print("self-test: ok")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    subparsers.add_parser("self-test")
    run = subparsers.add_parser("run")
    run.add_argument("--output-dir", default="outputs/malecns-tagger")
    run.add_argument("--work-dir", default=".cache/malecns-tagger")
    run.add_argument("--graph", choices=("malecns", "synthetic"), default="malecns")
    run.add_argument("--nodes", type=int, default=512)
    run.add_argument("--input-nodes", type=int, default=64)
    run.add_argument("--chunk-bytes", type=int, default=192)
    run.add_argument("--negatives-per-positive", type=int, default=2)
    run.add_argument("--epochs", type=int, default=3)
    run.add_argument("--batch-size", type=int, default=4)
    run.add_argument("--learning-rate", type=float, default=3e-3)
    run.add_argument("--baseline-learning-rate", type=float, default=1e-2)
    run.add_argument("--leak", type=float, default=0.35)
    run.add_argument("--recurrent-gain", type=float, default=0.9)
    run.add_argument("--input-gain", type=float, default=0.5)
    run.add_argument("--seed", type=int, default=20260912)
    run.add_argument("--max-train-docs", type=int, default=0)
    run.add_argument("--max-val-docs", type=int, default=0)
    run.add_argument("--cpu", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    if args.command == "self-test":
        return self_test()
    if args.command == "run":
        return run_experiment(args)
    raise AssertionError(args.command)


if __name__ == "__main__":
    sys.exit(main())
