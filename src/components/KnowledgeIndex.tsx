import { listKnowledge } from "../content";
import {
  KIND_LABELS,
  type Knowledge,
  type KnowledgeKind,
} from "../content/schema";
import { MathText } from "./Math";

const KIND_ORDER: KnowledgeKind[] = [
  "definition",
  "theorem",
  "property",
  "technique",
  "example",
];

export function KnowledgeIndex() {
  const byKind = new Map<KnowledgeKind, Knowledge[]>();
  for (const k of listKnowledge()) {
    const list = byKind.get(k.kind) ?? [];
    list.push(k);
    byKind.set(k.kind, list);
  }

  return (
    <div className="knowledge-index">
      <h1>知識一覧</h1>
      <p className="lead">
        登録されている定義・定理・性質・考え方の一覧です。
      </p>
      {KIND_ORDER.map((kind) => {
        const items = byKind.get(kind);
        if (!items || items.length === 0) return null;
        return (
          <section key={kind} className="knowledge-index-section">
            <h2>{KIND_LABELS[kind]}</h2>
            <ul>
              {items.map((k) => (
                <li key={k.id} className="knowledge-index-item">
                  <h3>{k.name}</h3>
                  <div className="knowledge-statement">
                    <MathText text={k.statement} />
                  </div>
                  {k.usage && (
                    <p className="knowledge-usage">
                      <span className="field-label">使いどころ:</span>{" "}
                      <MathText text={k.usage} />
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
