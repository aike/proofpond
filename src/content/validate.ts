import type { Knowledge, Problem } from "./schema";

/**
 * スキーマ検証後の参照整合性チェック。
 * ビルド時スクリプト(scripts/validate-content.ts)と実行時(content/index.ts)で共用する。
 */
export function checkIntegrity(
  knowledge: Knowledge[],
  problems: Problem[],
): string[] {
  const errors: string[] = [];

  const knowledgeIds = new Set<string>();
  for (const k of knowledge) {
    if (knowledgeIds.has(k.id)) errors.push(`知識IDが重複しています: ${k.id}`);
    knowledgeIds.add(k.id);
  }
  for (const k of knowledge) {
    for (const rid of k.relatedIds) {
      if (!knowledgeIds.has(rid)) {
        errors.push(`知識「${k.id}」の relatedIds に存在しないID: ${rid}`);
      }
    }
  }

  const problemIds = new Set<string>();
  for (const p of problems) {
    if (problemIds.has(p.id)) errors.push(`問題IDが重複しています: ${p.id}`);
    problemIds.add(p.id);

    for (const kid of p.knowledgeIds) {
      if (!knowledgeIds.has(kid)) {
        errors.push(`問題「${p.id}」の knowledgeIds に存在しないID: ${kid}`);
      }
    }

    const subgoalIds = new Set<string>();
    for (const s of p.subgoals) {
      if (subgoalIds.has(s.id)) {
        errors.push(`問題「${p.id}」の中間ゴールIDが重複しています: ${s.id}`);
      }
      subgoalIds.add(s.id);
    }
  }

  return errors;
}
