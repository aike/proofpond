import type { Hint, Problem, Subgoal } from "../../content/schema";
import { useProgress } from "../../state/ProgressContext";
import type { ProblemProgress } from "../../state/storage";
import { MathText } from "../Math";
import { Panel } from "./Panel";

const HINT_LEVEL_LABELS: Record<number, string> = {
  1: "方向性",
  2: "使う定理・知識",
  3: "証明の流れ",
  4: "ほぼ完成形",
};

/** 段階的ヒントの表示。開示済みを積み上げ、次のレベルのボタンだけ活性化する。 */
function HintList({
  hints,
  revealedLevel,
  onReveal,
}: {
  hints: Hint[];
  revealedLevel: number;
  onReveal: (level: number) => void;
}) {
  const next = hints.find((h) => h.level === revealedLevel + 1);
  return (
    <div className="hint-list">
      {hints
        .filter((h) => h.level <= revealedLevel)
        .map((h) => (
          <div key={h.level} className="hint-item">
            <span className="hint-level">
              Lv{h.level}・{HINT_LEVEL_LABELS[h.level]}
            </span>
            <div className="hint-text">
              <MathText text={h.text} />
            </div>
          </div>
        ))}
      {next ? (
        <button
          type="button"
          className="hint-button"
          onClick={() => onReveal(next.level)}
        >
          レベル{next.level}のヒントを見る({HINT_LEVEL_LABELS[next.level]})
        </button>
      ) : revealedLevel > 0 ? (
        <p className="panel-note">これ以上のヒントはありません。</p>
      ) : null}
    </div>
  );
}

export function HintPanel({
  problem,
  progress,
  currentSubgoal,
}: {
  problem: Problem;
  progress: ProblemProgress;
  currentSubgoal: Subgoal | undefined;
}) {
  const { dispatch } = useProgress();

  return (
    <Panel title="ヒント">
      {currentSubgoal ? (
        <>
          <p className="hint-context">
            現在の中間ゴール「{currentSubgoal.title}」のヒント
          </p>
          {currentSubgoal.hints.length > 0 ? (
            <HintList
              hints={currentSubgoal.hints}
              revealedLevel={progress.revealedHints[currentSubgoal.id] ?? 0}
              onReveal={(level) =>
                dispatch({
                  type: "revealHint",
                  problemId: problem.id,
                  hintKey: currentSubgoal.id,
                  level,
                })
              }
            />
          ) : (
            <p className="panel-note">この中間ゴールにはヒントがありません。</p>
          )}
        </>
      ) : (
        <p className="panel-note">すべての中間ゴールを達成済みです。</p>
      )}
      {problem.overallHints.length > 0 && (
        <details className="overall-hints">
          <summary>問題全体のヒント(全体の見取り図)</summary>
          <HintList
            hints={problem.overallHints}
            revealedLevel={progress.revealedHints["overall"] ?? 0}
            onReveal={(level) =>
              dispatch({
                type: "revealHint",
                problemId: problem.id,
                hintKey: "overall",
                level,
              })
            }
          />
        </details>
      )}
    </Panel>
  );
}
