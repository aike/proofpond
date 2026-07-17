import { z } from "zod";
import {
  KnowledgeSchema,
  ProblemSchema,
  type Knowledge,
  type Problem,
} from "./schema";
import { checkIntegrity } from "./validate";

/**
 * コンテンツの読み込み・検証・公開API。
 * UI層はこのモジュールの関数経由でのみコンテンツに触れる(生配列はexportしない)。
 * 将来AIによる問題生成等を入れる場合は、同じシグネチャの別実装に差し替えるだけでよい。
 */

const knowledgeModules = import.meta.glob("./knowledge/*.json", {
  eager: true,
}) as Record<string, { default: unknown }>;
const problemModules = import.meta.glob("./problems/*.json", {
  eager: true,
}) as Record<string, { default: unknown }>;

function loadAll(): { knowledge: Knowledge[]; problems: Problem[] } {
  const errors: string[] = [];
  const knowledge: Knowledge[] = [];
  const problems: Problem[] = [];

  for (const [file, mod] of Object.entries(knowledgeModules)) {
    const parsed = z.array(KnowledgeSchema).safeParse(mod.default);
    if (parsed.success) knowledge.push(...parsed.data);
    else {
      errors.push(
        `${file}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      );
    }
  }
  for (const [file, mod] of Object.entries(problemModules)) {
    const parsed = ProblemSchema.safeParse(mod.default);
    if (parsed.success) problems.push(parsed.data);
    else {
      errors.push(
        `${file}: ${parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      );
    }
  }

  errors.push(...checkIntegrity(knowledge, problems));
  if (errors.length > 0) {
    throw new Error("コンテンツ検証エラー:\n" + errors.join("\n"));
  }
  return { knowledge, problems };
}

const { knowledge, problems } = loadAll();
const knowledgeMap = new Map(knowledge.map((k) => [k.id, k]));
const problemMap = new Map(problems.map((p) => [p.id, p]));
const sortedProblems = [...problems].sort(
  (a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id),
);

export function getKnowledge(id: string): Knowledge | undefined {
  return knowledgeMap.get(id);
}

export function listKnowledge(): readonly Knowledge[] {
  return knowledge;
}

export function getProblem(id: string): Problem | undefined {
  return problemMap.get(id);
}

export function listProblems(): readonly Problem[] {
  return sortedProblems;
}
