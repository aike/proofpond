import { z } from "zod";

/**
 * 知識の種類。
 * 仕様書5章の「定義・定理・性質」に加え、4.1の「典型問題(example)」
 * 「証明でよく使う考え方(technique)」を種類として吸収する。
 */
export const KnowledgeKindSchema = z.enum([
  "definition",
  "theorem",
  "property",
  "technique",
  "example",
]);
export type KnowledgeKind = z.infer<typeof KnowledgeKindSchema>;

export const KIND_LABELS: Record<KnowledgeKind, string> = {
  definition: "定義",
  theorem: "定理",
  property: "性質",
  technique: "考え方",
  example: "典型問題",
};

const idPattern = /^[a-z0-9-]+$/;

export const KnowledgeSchema = z.object({
  id: z.string().regex(idPattern, "idは小文字英数字とハイフンのみ"),
  name: z.string().min(1),
  kind: KnowledgeKindSchema,
  /** 本文。LaTeXは $...$ / $$...$$ で埋め込む */
  statement: z.string().min(1),
  relatedIds: z.array(z.string()).default([]),
  /** 典型的な利用場面 */
  usage: z.string().optional(),
  tags: z.array(z.string()).default([]),
});
export type Knowledge = z.infer<typeof KnowledgeSchema>;

export const HintSchema = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  text: z.string().min(1),
});
export type Hint = z.infer<typeof HintSchema>;

/** ヒントレベルは1から連続していること(1,2,3=OK / 2,4=NG) */
export const HintListSchema = z
  .array(HintSchema)
  .superRefine((hints, ctx) => {
    for (let i = 0; i < hints.length; i++) {
      if (hints[i].level !== i + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `ヒントレベルは1から連続させてください(実際: ${hints
            .map((h) => h.level)
            .join(",")})`,
        });
        return;
      }
    }
  });

export const SubgoalSchema = z.object({
  id: z.string().regex(idPattern),
  title: z.string().min(1),
  description: z.string().optional(),
  /** この中間ゴール専用の段階的ヒント(最大4段階) */
  hints: HintListSchema.default([]),
  /** この中間ゴールの模範解答(必須)。要求時のみ表示される */
  solution: z.string().min(1),
});
export type Subgoal = z.infer<typeof SubgoalSchema>;

/**
 * 最終ゴール。示すべき命題だけでなく、
 * 「なぜそれを示せば問題の証明になるのか」「どうすれば思いつけるのか」の解説を必ず持つ。
 */
export const FinalGoalSchema = z.object({
  /** 示すべき命題(LaTeX可) */
  statement: z.string().min(1),
  /** なぜこれを示せば問題の証明になるのかの説明 */
  why: z.string().min(1),
  /** この最終ゴールを思いつくために必要な知識と発想方法 */
  howToFind: z.string().min(1),
});
export type FinalGoal = z.infer<typeof FinalGoalSchema>;

/**
 * 問題データ。
 * 模範解答は中間ゴール単位で持つ(subgoals[].solution)。
 * 問題全体の一枚岩の解答は持たず、学習者はステップごとに自分の答案と照合する。
 */
export const ProblemSchema = z.object({
  id: z.string().regex(idPattern),
  title: z.string().min(1),
  statement: z.string().min(1),
  difficulty: z.number().int().min(1).max(3).default(1),
  knowledgeIds: z.array(z.string()).min(1),
  finalGoal: FinalGoalSchema,
  subgoals: z.array(SubgoalSchema).min(1),
  /** 問題全体の見取り図ヒント(任意) */
  overallHints: HintListSchema.default([]),
  tags: z.array(z.string()).default([]),
});
export type Problem = z.infer<typeof ProblemSchema>;
