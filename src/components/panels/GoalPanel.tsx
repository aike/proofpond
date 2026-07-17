import type { Problem } from "../../content/schema";
import { MathText } from "../Math";
import { Panel } from "./Panel";

export function GoalPanel({ problem }: { problem: Problem }) {
  const goal = problem.finalGoal;
  return (
    <Panel title="最終ゴール">
      <p className="goal-body">
        <MathText text={goal.statement} />
      </p>
      <details className="goal-explanation">
        <summary>
          この最終ゴールの解説 — なぜこれで証明になる? どう思いつく?
        </summary>
        <div className="goal-explanation-block">
          <h3>なぜこれを示せば証明になるのか</h3>
          <p>
            <MathText text={goal.why} />
          </p>
        </div>
        <div className="goal-explanation-block">
          <h3>思いつくために必要な知識と発想</h3>
          <p>
            <MathText text={goal.howToFind} />
          </p>
        </div>
      </details>
    </Panel>
  );
}
