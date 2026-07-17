import { getProblem } from "../content";
import { useProblemProgress, useProgress } from "../state/ProgressContext";
import { GoalPanel } from "./panels/GoalPanel";
import { HintPanel } from "./panels/HintPanel";
import { KnowledgePanel } from "./panels/KnowledgePanel";
import { StatementPanel } from "./panels/StatementPanel";
import { SubgoalPanel } from "./panels/SubgoalPanel";

export function ProblemView({ problemId }: { problemId: string }) {
  const { dispatch } = useProgress();
  const progress = useProblemProgress(problemId);
  const problem = getProblem(problemId);

  if (!problem) {
    return (
      <p className="notfound">
        問題が見つかりません。<a href="#/">問題一覧へ戻る</a>
      </p>
    );
  }

  // 「現在の中間ゴール」は達成済みリストから導出する(二重管理しない)
  const currentSubgoal = problem.subgoals.find(
    (s) => !progress.completedSubgoalIds.includes(s.id),
  );

  return (
    <div className="problem-view">
      <div className="problem-view-top">
        <a href="#/">← 問題一覧</a>
        <button
          type="button"
          className="ghost-button danger"
          onClick={() => {
            if (
              window.confirm(
                "この問題の進捗(チェック・ヒント開示状況)をすべてリセットしますか?",
              )
            ) {
              dispatch({ type: "resetProblem", problemId });
            }
          }}
        >
          進捗をリセット
        </button>
      </div>
      <StatementPanel problem={problem} />
      <KnowledgePanel problem={problem} progress={progress} />
      <GoalPanel problem={problem} />
      <SubgoalPanel
        problem={problem}
        progress={progress}
        currentSubgoal={currentSubgoal}
      />
      <HintPanel
        problem={problem}
        progress={progress}
        currentSubgoal={currentSubgoal}
      />
    </div>
  );
}
