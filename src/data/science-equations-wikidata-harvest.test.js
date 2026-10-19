import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import test from "node:test";

import {
  extractP2534Records,
  harvestStream,
  parseDumpLine,
} from "../../scripts/science-equations/harvest-wikidata-p2534.mjs";

test("parseDumpLine accepts Wikidata array dump lines", () => {
  assert.equal(parseDumpLine("["), null);
  assert.equal(parseDumpLine("]"), null);
  assert.deepEqual(parseDumpLine('{"id":"Q1"},'), { id: "Q1" });
});

test("extractP2534Records preserves attested notation and statement provenance", () => {
  const entity = {
    id: "Q41591",
    type: "item",
    lastrevid: 123,
    claims: {
      P2534: [
        {
          id: "Q41591$statement-1",
          rank: "normal",
          mainsnak: {
            snaktype: "value",
            datavalue: { type: "string", value: "R=\\frac{U}{I}" },
          },
          qualifiers: { P2559: [{ snaktype: "value" }] },
          references: [{ hash: "reference-1", snaks: {} }],
        },
        {
          id: "Q41591$no-value",
          rank: "normal",
          mainsnak: { snaktype: "novalue" },
        },
      ],
      P7235: [{ id: "Q41591$symbol-1", rank: "normal" }],
    },
  };

  const records = extractP2534Records(entity, { snapshot: "2026-09-23-test" });

  assert.equal(records.length, 1);
  assert.equal(records[0].source_id, "wikidata-p2534");
  assert.equal(records[0].source_license, "CC0-1.0");
  assert.match(records[0].source_policy_url, /Wikidata:Licensing$/);
  assert.equal(records[0].source_entity_id, "Q41591");
  assert.equal(records[0].source_statement_id, "Q41591$statement-1");
  assert.equal(records[0].original_expression, "R=\\frac{U}{I}");
  assert.equal(records[0].provenance_class, "attested");
  assert.equal(records[0].symbol_claims_p7235.length, 1);
  assert.match(records[0].source_statement_sha256, /^[a-f0-9]{64}$/);
});

test("harvestStream writes JSONL and honors the record limit", async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  let text = "";
  output.setEncoding("utf8");
  output.on("data", (chunk) => {
    text += chunk;
  });

  input.end(
    [
      "[",
      JSON.stringify({
        id: "Q1",
        type: "item",
        claims: {
          P2534: [
            {
              id: "Q1$a",
              rank: "normal",
              mainsnak: { snaktype: "value", datavalue: { value: "a=b" } },
            },
            {
              id: "Q1$b",
              rank: "normal",
              mainsnak: { snaktype: "value", datavalue: { value: "c=d" } },
            },
          ],
        },
      }) + ",",
      "]",
    ].join("\n"),
  );

  const metrics = await harvestStream(input, output, {
    snapshot: "fixture",
    limit: 1,
  });

  assert.deepEqual(metrics, { parsedEntities: 1, matchedEntities: 1, recordsWritten: 1 });
  const rows = text.trim().split("\n").map(JSON.parse);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].original_expression, "a=b");
});
