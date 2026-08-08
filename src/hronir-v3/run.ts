import { validateAssignment } from "./assignment.js";
import { validateEvaluation } from "./evaluation.js";
import { OkfWriter, type OkfResult } from "./okf-writer.js";
import { validatePlan } from "./plans.js";
import {
  assignmentImportRow,
  evaluationImportRow,
} from "./serialization.js";
import type { Assignment, Evaluation, EvaluationPlan } from "./types.js";

export interface RunTurnInput {
  plan: EvaluationPlan;
  assignment: Assignment;
  evaluation?: Evaluation;
}

export interface RunTurnResult {
  assignment: OkfResult;
  evaluation?: OkfResult;
  transition?: OkfResult;
  written: boolean;
}

function assertValid(label: string, errors: string[]): void {
  if (errors.length > 0) {
    throw new Error(`${label} is invalid:\n- ${errors.join("\n- ")}`);
  }
}

export function runTurn(
  input: RunTurnInput,
  options: { bundlePath: string; write: boolean; writer?: OkfWriter }
): RunTurnResult {
  assertValid("plan", validatePlan(input.plan));
  assertValid(
    "assignment",
    validateAssignment(input.assignment, input.plan)
  );
  if (input.evaluation) {
    assertValid(
      "evaluation",
      validateEvaluation({
        evaluation: input.evaluation,
        assignment: input.assignment,
        plan: input.plan,
      })
    );
  }

  const writer = options.writer ?? new OkfWriter(options.bundlePath);
  const assignment = writer.importConcept(
    "Assignment",
    assignmentImportRow(input.assignment),
    options
  );
  if (!input.evaluation) {
    return { assignment, written: options.write };
  }

  const evaluation = writer.importConcept(
    "Evaluation",
    evaluationImportRow(input.evaluation),
    options
  );
  const transition = writer.completeEvaluatedAssignments(options);
  return { assignment, evaluation, transition, written: options.write };
}
