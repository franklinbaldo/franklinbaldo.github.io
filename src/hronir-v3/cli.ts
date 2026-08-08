import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runTurn, type RunTurnInput, type RunTurnResult } from "./run.js";

interface RunCommandDependencies {
  readText(path: string | number): string;
  run(
    input: RunTurnInput,
    options: { bundlePath: string; write: boolean }
  ): RunTurnResult;
}

const defaults: RunCommandDependencies = {
  readText: (path) => readFileSync(path, "utf8"),
  run: runTurn,
};

export function executeRunCommand(
  args: string[],
  dependencies: RunCommandDependencies = defaults
): RunTurnResult {
  let bundle = ".routines/hronir-v3";
  let dryRun = false;
  const positional: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === "--bundle") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("--bundle requires a value");
      }
      bundle = value;
      index += 1;
    } else if (args[index] === "--dry-run") {
      dryRun = true;
    } else if (args[index].startsWith("--")) {
      throw new Error(`unknown option: ${args[index]}`);
    } else {
      positional.push(args[index]);
    }
  }
  const bundlePath = resolve(bundle);
  if (positional.length !== 1 || positional[0].startsWith("--")) {
    throw new Error(
      "usage: hronir run <turn.json|-> [--bundle <path>] [--dry-run]"
    );
  }
  const source = positional[0] === "-" ? 0 : resolve(positional[0]);
  let input: RunTurnInput;
  try {
    input = JSON.parse(dependencies.readText(source)) as RunTurnInput;
  } catch (error) {
    throw new Error(`could not read turn from ${positional[0]}`, {
      cause: error,
    });
  }
  return dependencies.run(input, {
    bundlePath,
    write: !dryRun,
  });
}

export function main(args: string[]): void {
  try {
    console.log(JSON.stringify(executeRunCommand(args), null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
