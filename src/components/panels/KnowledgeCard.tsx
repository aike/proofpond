import { getKnowledge } from "../../content";
import type { Knowledge } from "../../content/schema";
import { MathText } from "../Math";

export function KnowledgeCard({
  knowledge,
  onRelated,
}: {
  knowledge: Knowledge;
  onRelated: (id: string) => void;
}) {
  return (
    <div className="knowledge-card">
      <div className="knowledge-statement">
        <MathText text={knowledge.statement} />
      </div>
      {knowledge.usage && (
        <p className="knowledge-usage">
          <span className="field-label">使いどころ:</span>{" "}
          <MathText text={knowledge.usage} />
        </p>
      )}
      {knowledge.relatedIds.length > 0 && (
        <p className="knowledge-related">
          <span className="field-label">関連:</span>
          {knowledge.relatedIds.map((rid) => {
            const related = getKnowledge(rid);
            if (!related) return null;
            return (
              <button
                key={rid}
                type="button"
                className="link-button"
                onClick={() => onRelated(rid)}
              >
                {related.name}
              </button>
            );
          })}
        </p>
      )}
    </div>
  );
}
