/**
 * コンテンツ検証CLI。`npm run validate` で実行(ビルド前に prebuild フックでも実行される)。
 * - 全JSONのZodスキーマ検証
 * - 参照整合性(knowledgeIds / relatedIds の実在、ID重複、ヒントレベル連続性)
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  KnowledgeSchema,
  ProblemSchema,
  type Knowledge,
  type Problem,
} from "../src/content/schema";
import { checkIntegrity } from "../src/content/validate";

const contentDir = fileURLToPath(new URL("../src/content", import.meta.url));

function readJsonFiles(dir: string): Array<{ file: string; data: unknown }> {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const path = join(dir, f);
      return { file: f, data: JSON.parse(readFileSync(path, "utf-8")) };
    });
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

const errors: string[] = [];
const knowledge: Knowledge[] = [];
const problems: Problem[] = [];

for (const { file, data } of readJsonFiles(join(contentDir, "knowledge"))) {
  const parsed = z.array(KnowledgeSchema).safeParse(data);
  if (parsed.success) knowledge.push(...parsed.data);
  else errors.push(`knowledge/${file}:\n${formatIssues(parsed.error)}`);
}

for (const { file, data } of readJsonFiles(join(contentDir, "problems"))) {
  const parsed = ProblemSchema.safeParse(data);
  if (parsed.success) problems.push(parsed.data);
  else errors.push(`problems/${file}:\n${formatIssues(parsed.error)}`);
}

for (const message of checkIntegrity(knowledge, problems)) {
  errors.push(message);
}

if (errors.length > 0) {
  console.error("✘ コンテンツ検証エラー:\n");
  for (const e of errors) console.error(e + "\n");
  process.exit(1);
}

console.log(
  `✔ コンテンツ検証OK: 知識 ${knowledge.length} 件 / 問題 ${problems.length} 問`,
);
