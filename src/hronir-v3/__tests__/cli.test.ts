import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { executeRunCommand } from "../cli.js";
import type { RunTurnInput, RunTurnResult } from "../run.js";

describe("hronir run CLI", () => {
  it("writes by default with one positional turn document", () => {
    let received:
      | { input: RunTurnInput; options: { bundlePath: string; write: boolean } }
      | undefined;
    const result = executeRunCommand(["turn.json"], {
      readText: () => '{"plan":{"id":"plan"}}',
      run: (input, options) => {
        received = { input, options };
        return { assignment: {}, written: options.write };
      },
    });
    assert.equal(received?.input.plan.id, "plan");
    assert.equal(received?.options.write, true);
    assert.match(received?.options.bundlePath ?? "", /.routines\/hronir-v3$/);
    assert.equal(result.written, true);
  });

  it("keeps preview behind the explicit dry-run option", () => {
    let write: boolean | undefined;
    executeRunCommand(["-", "--dry-run", "--bundle", "knowledge"], {
      readText: (path) => {
        assert.equal(path, 0);
        return "{}";
      },
      run: (_input, options): RunTurnResult => {
        write = options.write;
        return { assignment: {}, written: options.write };
      },
    });
    assert.equal(write, false);
  });

  it("rejects missing and unknown arguments", () => {
    const dependencies = {
      readText: () => "{}",
      run: (): RunTurnResult => ({ assignment: {}, written: false }),
    };
    assert.throws(() => executeRunCommand([], dependencies), /usage:/);
    assert.throws(
      () => executeRunCommand(["turn.json", "--mystery"], dependencies),
      /unknown option/
    );
  });
});
