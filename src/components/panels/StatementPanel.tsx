import type { Problem } from "../../content/schema";
import { MathText } from "../Math";
import { Panel } from "./Panel";

export function StatementPanel({ problem }: { problem: Problem }) {
  return (
    <Panel title="問題">
      <div className="statement-head">
        <h1 className="statement-title">{problem.title}</h1>
        <span className="difficulty" title={`難易度 ${problem.difficulty}/3`}>
          {"★".repeat(problem.difficulty)}
          {"☆".repeat(3 - problem.difficulty)}
        </span>
      </div>
      <p className="statement-body">
        <MathText text={problem.statement} />
      </p>
    </Panel>
  );
}
