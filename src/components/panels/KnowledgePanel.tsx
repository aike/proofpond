import { useState } from "react";
import { getKnowledge } from "../../content";
import { KIND_LABELS, type Problem } from "../../content/schema";
import { useProgress } from "../../state/ProgressContext";
import type { ProblemProgress } from "../../state/storage";
import { KnowledgeCard } from "./KnowledgeCard";
import { Panel } from "./Panel";

export function KnowledgePanel({
  problem,
  progress,
}: {
  problem: Problem;
  progress: ProblemProgress;
}) {
  const { dispatch } = useProgress();
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );
  // 関連リンク経由で開いた「必要知識リスト外」の知識は末尾に追加表示する
  const [extraIds, setExtraIds] = useState<string[]>([]);

  const shownIds = [...problem.knowledgeIds, ...extraIds];

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const showRelated = (id: string) => {
    if (!shownIds.includes(id)) setExtraIds((prev) => [...prev, id]);
    setExpandedIds((prev) => new Set(prev).add(id));
    // React のコミット後にスクロールする
    setTimeout(() => {
      document
        .getElementById(`kcard-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  return (
    <Panel title="必要知識">
      <ul className="knowledge-list">
        {shownIds.map((id) => {
          const k = getKnowledge(id);
          if (!k) return null;
          const checked = progress.checkedKnowledgeIds.includes(id);
          const expanded = expandedIds.has(id);
          const isExtra = extraIds.includes(id);
          return (
            <li
              key={id}
              id={`kcard-${id}`}
              className={isExtra ? "knowledge-item extra" : "knowledge-item"}
            >
              <div className="knowledge-row">
                <label className="knowledge-check">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      dispatch({
                        type: "toggleKnowledge",
                        problemId: problem.id,
                        knowledgeId: id,
                      })
                    }
                  />
                  <span
                    className={
                      checked ? "knowledge-name checked" : "knowledge-name"
                    }
                  >
                    {k.name}
                  </span>
                </label>
                <span className={`kind-badge kind-${k.kind}`}>
                  {KIND_LABELS[k.kind]}
                </span>
                <button
                  type="button"
                  className="ghost-button"
                  aria-expanded={expanded}
                  onClick={() => toggleExpand(id)}
                >
                  {expanded ? "閉じる" : "開く"}
                </button>
              </div>
              {expanded && <KnowledgeCard knowledge={k} onRelated={showRelated} />}
            </li>
          );
        })}
      </ul>
      <p className="panel-note">
        チェックは「内容を確認した」という自分用のメモです。
      </p>
    </Panel>
  );
}
