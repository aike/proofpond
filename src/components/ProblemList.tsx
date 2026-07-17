import { listProblems } from "../content";
import { useProgress } from "../state/ProgressContext";
import { MathText } from "./Math";

export function ProblemList() {
  const { state } = useProgress();

  return (
    <div className="problem-list-page">
      <h1>問題一覧</h1>
      <p className="lead">
        問題を選ぶと、必要知識・ゴール・段階的ヒントつきの演習画面が開きます。
      </p>
      <ul className="problem-list">
        {listProblems().map((p) => {
          const progress = state.problems[p.id];
          const status = progress?.completedAt
            ? "done"
            : progress
              ? "doing"
              : "todo";
          const statusLabel =
            status === "done" ? "完了" : status === "doing" ? "進行中" : "未着手";
          return (
            <li key={p.id}>
              <a className="problem-card" href={`#/problems/${p.id}`}>
                <div className="problem-card-head">
                  <span className="problem-card-title">{p.title}</span>
                  <span className={`status-badge status-${status}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="problem-card-statement">
                  <MathText text={p.statement} />
                </div>
                <div className="problem-card-meta">
                  <span className="difficulty">
                    {"★".repeat(p.difficulty)}
                    {"☆".repeat(3 - p.difficulty)}
                  </span>
                  {p.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
