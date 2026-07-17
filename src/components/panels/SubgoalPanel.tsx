import type { Problem, Subgoal } from "../../content/schema";
import { useProgress } from "../../state/ProgressContext";
import type { ProblemProgress } from "../../state/storage";
import { MathText } from "../Math";
import { Panel } from "./Panel";

export function SubgoalPanel({
  problem,
  progress,
  currentSubgoal,
}: {
  problem: Problem;
  progress: ProblemProgress;
  currentSubgoal: Subgoal | undefined;
}) {
  const { dispatch } = useProgress();
  const completed = progress.completedSubgoalIds;

  return (
    <Panel title="中間ゴール">
      <ol className="subgoal-list">
        {problem.subgoals.map((s, i) => {
          const isDone = completed.includes(s.id);
          const isCurrent = currentSubgoal?.id === s.id;
          const stateClass = isDone ? "done" : isCurrent ? "current" : "future";
          return (
            <li key={s.id} className={`subgoal ${stateClass}`}>
              <span className="subgoal-marker" aria-hidden="true">
                {isDone ? "✔" : isCurrent ? "●" : "○"}
              </span>
              <div className="subgoal-body">
                <span className="subgoal-title">
                  {i + 1}. {s.title}
                  {isCurrent && <span className="current-label">← いまここ</span>}
                </span>
                {/* 未来のゴールはタイトルのみ薄く表示(見通しは思考の助けになる) */}
                {(isDone || isCurrent) && s.description && (
                  <p className="subgoal-desc">
                    <MathText text={s.description} />
                  </p>
                )}
                {/* 模範解答: 現在・達成済みのゴールのみ、要求時に開示(不可逆) */}
                {(isDone || isCurrent) &&
                  (progress.revealedSolutionIds.includes(s.id) ? (
                    <div className="solution">
                      <span className="solution-label">模範解答</span>
                      <div className="solution-text">
                        <MathText text={s.solution} />
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="solution-button"
                      onClick={() =>
                        dispatch({
                          type: "revealSolution",
                          problemId: problem.id,
                          subgoalId: s.id,
                        })
                      }
                    >
                      模範解答を見る
                    </button>
                  ))}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="subgoal-actions">
        {currentSubgoal ? (
          <button
            type="button"
            className="primary-button"
            onClick={() =>
              dispatch({
                type: "completeSubgoal",
                problemId: problem.id,
                subgoalId: currentSubgoal.id,
                totalSubgoals: problem.subgoals.length,
              })
            }
          >
            「{currentSubgoal.title}」を達成した ✔
          </button>
        ) : (
          <p className="complete-message">
            🎉 すべての中間ゴールを達成しました。証明を清書して仕上げましょう。
          </p>
        )}
        {completed.length > 0 && (
          <button
            type="button"
            className="ghost-button"
            onClick={() =>
              dispatch({ type: "undoSubgoal", problemId: problem.id })
            }
          >
            1つ戻す
          </button>
        )}
      </div>
    </Panel>
  );
}
