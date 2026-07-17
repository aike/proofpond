# 線形代数証明支援システム 設計書

**バージョン:** 0.1
**作成日:** 2026-07-17
**対応仕様:** linear-algebra-proof-assistant-spec.md v0.1

---

# 1. 設計の前提(確定事項)

| 項目 | 決定 |
|---|---|
| 解析エンジン | **登録済み問題のみ**。問題・ゴール・ヒントはすべて事前登録コンテンツ。システムは表示制御(段階的開示・進行管理)に専念する。LLM・自動解析は使わない |
| アプリ形態 | **Webアプリ(SPA)**。バックエンド不要の静的サイト。GitHub Pages 等にそのまま配備可能 |
| 実装言語 | **TypeScript** |

**模範解答は中間ゴール単位で保持し(`subgoals[].solution`、必須)、ユーザー要求時のみ開示する**(仕様v0.2 §4.5)。対象は現在・達成済みの中間ゴールのみで、未来のゴールの解答は見えない。開示はヒントと同様に不可逆で、進捗として永続化・ログ記録される。

---

# 2. 技術スタック

| 項目 | 選定 | 根拠 |
|---|---|---|
| 言語 | TypeScript 5.x (strict) | スキーマ型とUIの型を一気通貫にできる |
| ビルド | Vite | 静的SPAの標準。`vite build` でそのまま静的サイト化 |
| UI | React 18 | パネル型UI+状態管理に十分なエコシステム |
| 数式 | KaTeX(薄い自作ラッパー) | MathJaxより軽量・高速。初年次線形代数の記法(行列・集合・写像・∀∃)を全て賄える |
| ルーティング | 自作ハッシュルーティング(~50行) | 画面は3つのみ。依存ゼロで、静的ホスティングのリロード404問題も回避 |
| スキーマ検証 | Zod | スキーマ定義=型導出=実行時検証を1ソースで実現 |
| スタイル | 素のCSS(CSS変数+Grid) | パネルレイアウトは数十行で足りる |
| 状態管理 | useReducer + Context + localStorage | 外部ライブラリ不要の規模 |
| テスト | Vitest + Testing Library | Vite同梱系で追加コスト最小 |

実行時依存は `react` / `react-dom` / `katex` / `zod` の4つのみ。

---

# 3. データ設計

## 3.1 コンテンツ形式: JSON

- Viteがそのまま import でき、ビルド時に型チェック+Zod検証を通せる
- LaTeX混在文はYAMLだとエスケープ事故が起きやすい。JSONは機械検証しやすい
- 執筆体験を上げたければ将来 YAML→JSON 変換スクリプトを追加すればよい(スキーマはZodに集約されているため移行容易)

## 3.2 知識DBスキーマ

仕様5章の「定義・定理・性質」に加え、4.1の「典型問題」「考え方」を kind として吸収する。

```ts
const KnowledgeKind = z.enum(["definition", "theorem", "property", "technique", "example"]);

const KnowledgeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),   // 例: "subspace-def"
  name: z.string(),                         // 例: "部分空間の定義"
  kind: KnowledgeKind,
  statement: z.string(),                    // 本文。LaTeXは $...$ / $$...$$ で埋め込む
  relatedIds: z.array(z.string()).default([]),  // 関連知識(検証時に存在チェック)
  usage: z.string().optional(),             // 典型的な利用場面
  tags: z.array(z.string()).default([]),    // 将来の検索・苦手分野推定用
});
```

## 3.3 問題スキーマ

**仕様解釈: ヒント(4.4)は「中間ゴールごと」を主とする。** 学習者が詰まるのは常に現在の中間ゴールであり、そこにヒントを紐付ける方が「先生が横でヒントを出す」体験に忠実。レベル3〜4は問題全体に及ぶ内容にもなり得るため、問題全体ヒントもオプションで持てる二段構えとする。

```ts
const HintSchema = z.object({
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  text: z.string(),   // LaTeX可
});
// 検証: レベルは1から連続していること(1,2,3=OK / 2,4=NG)

const SubgoalSchema = z.object({
  id: z.string(),
  title: z.string(),                    // 例: "定義を書く"
  description: z.string().optional(),
  hints: z.array(HintSchema).default([]),
  solution: z.string().min(1),          // 模範解答(必須、LaTeX可)
});

const FinalGoalSchema = z.object({
  statement: z.string(),   // 示すべき命題(LaTeX可)
  why: z.string(),         // なぜこれを示せば問題の証明になるのか
  howToFind: z.string(),   // この最終ゴールを思いつくために必要な知識と発想方法
});

const ProblemSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  statement: z.string(),                 // 問題文(LaTeX可)
  difficulty: z.number().int().min(1).max(3).default(1),
  knowledgeIds: z.array(z.string()).min(1),
  finalGoal: FinalGoalSchema,            // 最終ゴール+解説(3項目とも必須)
  subgoals: z.array(SubgoalSchema).min(1),
  overallHints: z.array(HintSchema).default([]),
  tags: z.array(z.string()).default([]),
});
```

レベル4ヒントを「ほぼ完成形」に留め、清書された解答文は `solution` にのみ書く——この粒度分担は `content/README.md` の執筆規約で統制する。

## 3.4 コンテンツ検証

1. **ビルド時**: `scripts/validate-content.ts`(`npm run validate`、`prebuild` フックで必須実行)
   - 全JSONのZodパース
   - 参照整合性(knowledgeIds / relatedIds の実在、ID重複、ヒントレベル連続性)
2. **実行時**: `src/content/index.ts` の import 時に一度だけ safeParse(開発中の編集ミスを即検知)

---

# 4. ディレクトリ構成

```
proofpond/
├── index.html
├── package.json / tsconfig.json / vite.config.ts
├── scripts/
│   └── validate-content.ts        # コンテンツ検証CLI
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # ハッシュルーティング分岐
│   ├── app.css                    # CSS変数・パネルレイアウト
│   ├── content/
│   │   ├── schema.ts              # Zodスキーマ(型の単一情報源)
│   │   ├── index.ts               # 読込+検証+公開API(getProblem等)
│   │   ├── knowledge/             # 分野別ファイル
│   │   │   ├── vector-space.json
│   │   │   ├── linear-map.json
│   │   │   └── eigen.json
│   │   ├── problems/
│   │   │   ├── w-subspace.json
│   │   │   ├── injective-kernel.json
│   │   │   └── eigen-independent.json
│   │   └── README.md              # 執筆規約(LaTeX規約・ヒント粒度)
│   ├── state/
│   │   ├── progressReducer.ts     # 進捗状態のreducer
│   │   ├── ProgressContext.tsx
│   │   └── storage.ts             # localStorage同期(バージョン付き)
│   ├── components/
│   │   ├── Math.tsx               # KaTeX混在テキスト描画
│   │   ├── ProblemList.tsx        # 問題一覧
│   │   ├── ProblemView.tsx        # 演習画面(パネル統括)
│   │   └── panels/
│   │       ├── StatementPanel.tsx
│   │       ├── KnowledgePanel.tsx
│   │       ├── KnowledgeCard.tsx
│   │       ├── GoalPanel.tsx
│   │       ├── SubgoalPanel.tsx
│   │       └── HintPanel.tsx
│   └── lib/
│       └── router.ts
└── design.md(本書)
```

---

# 5. UI設計

## 5.1 画面構成

- `#/` … 問題一覧(タイトル・難易度・タグ・進捗バッジ)
- `#/problems/:id` … 演習画面
- `#/knowledge` … 知識一覧(任意・後回し可)

## 5.2 演習画面(仕様6章のUIイメージ準拠・縦積みパネル)

```
┌ 問題文 ─────────────────────────┐ 常時表示
├ 必要知識 ───────────────────────┤
│ ☑ 部分空間の定義   [定義] ▸      │ チェック=確認済みの自己申告(進捗に保存)
│ ☐ 加法閉性         [性質] ▸      │ ▸でカードをアコーディオン展開
│   └ 説明+利用場面+関連知識リンク │ 関連リンクは該当カードへスクロール&展開
├ 最終ゴール ─────────────────────┤
│ ∀x,y: T(x)=T(y) ⇒ x=y           │
├ 中間ゴール ─────────────────────┤
│ ✔ 1. 定義を書く                  │ 達成済み=チェック付き全文表示
│ ● 2. 仮定を書く   ← 現在         │ 現在のゴールを強調
│ ・3. …(タイトルのみ薄く表示)    │ 未来はタイトルのみ薄表示(見通しは思考の
│ [達成した ✔] [戻す]              │ 助けになり、ネタバレはヒント側にあるため)
├ ヒント ─────────────────────────┤
│ 現在のゴールのヒント              │
│ ▸ Lv1: まず◯◯に注目…(開示済)   │ 開示済みは積み上げ表示
│ [レベル2のヒントを見る]           │ ボタンは次レベルのみ活性(順開示)
│ ── 全体ヒント(折りたたみ) ──    │
└─────────────────────────────────┘
```

設計上のポイント:

- **Math.tsx**: テキストを `$...$` / `$$...$$` で分割し、地の文とKaTeXレンダリング結果を交互に出力する純関数コンポーネント。`useMemo` でキャッシュ
- **中間ゴール達成は自己申告制**(答案の自動判定はしない=登録済み問題方式と整合)。「達成した」ボタンで進行、「戻す」で誤操作復帰
- **模範解答は中間ゴール単位で開示**: 現在・達成済みのゴールにのみ「模範解答を見る」ボタンを表示。未来のゴールの解答は見えない
- **最終ゴールの解説**: ゴールの命題は常時表示し、解説(なぜこれで証明になるか/思いつくための知識と発想)は GoalPanel 内の折りたたみで随時参照できる
- **ヒント・模範解答の開示は不可逆**: 一度見たものは表示され続ける。「見た」事実が学習履歴(仕様8章)の素材になる
- 必要知識とゴールは常に可視(仕様7章)

---

# 6. 状態管理

```ts
interface ProblemProgress {
  checkedKnowledgeIds: string[];      // 知識チェックリスト
  completedSubgoalIds: string[];      // 達成済み中間ゴール
  revealedHints: Record<string /* subgoalId | "overall" */, number /* 開示済み最大Lv */>;
  revealedSolutionIds: string[];      // 模範解答を開示した中間ゴールID
  completedAt?: string;
}
interface AppState {
  version: 1;                          // マイグレーション用
  problems: Record<string, ProblemProgress>;
}
```

- **localStorage永続化は必須**(キー `proofpond:v1`)。証明演習は離脱→再開が常態のため。`version` 不一致時は安全に初期化
- 「現在の中間ゴール」は `subgoals.find(s => !completed)` で導出し二重管理しない
- 問題単位の進捗リセットボタンを演習画面に配置
- reducerのアクションログを別キーに積んでおくと、将来の学習履歴分析・苦手推定に最小コストで直結する(採用推奨)

---

# 7. 初期コンテンツ計画

## 問題3問

1. **w-subspace**: 「$W = \{(x,y,z) \in \mathbb{R}^3 \mid x+y+z=0\}$ が部分空間であることを示せ」(仕様4.1の例)
   - 中間ゴール: ①定義(3条件)を書く → ②零ベクトルの所属 → ③加法閉性 → ④スカラー倍閉性
2. **injective-kernel**: 「線形写像 $T$ が単射 $\iff \operatorname{Ker} T = \{\mathbf{0}\}$」(仕様4.2の例)
   - 中間ゴール: ①両方向に分ける → ②(⇒) → ③(⇐): $T(x)=T(y) \Rightarrow T(x-y)=\mathbf{0}$ → ④結論
3. **eigen-independent**: 「相異なる固有値に属する固有ベクトルは一次独立(2個の場合)」— 中級寄り・背理法を含む

各中間ゴールにLv1〜4のヒントを付与(Lv1: 方向性 / Lv2: 使う定理 / Lv3: 流れ / Lv4: ほぼ完成形)。

## 知識エントリ(約15件)

- `vector-space.json`: 部分空間の定義、零ベクトル、加法閉性、スカラー倍閉性、部分空間判定の典型手順(technique)
- `linear-map.json`: 線形写像の定義、単射の定義、Kerの定義、線形写像は零を零に写す、同値証明の分割(technique)、背理法・対偶(technique)
- `eigen.json`: 固有値・固有ベクトルの定義、一次独立の定義、一次関係式から始める技法(technique)

全エントリに `relatedIds` と `usage` を必ず記入。この相互リンクが知識カード導線の実体となる。

## 問題追加ワークフロー(add-problem スキル)

問題の追加は Claude Code のプロジェクトスキル `/add-problem`(`.claude/skills/add-problem/SKILL.md`)で行う。ざっくりした問題のアイデアを渡すと、(1) 数学の問題文として清書 → (2) 既存知識の再利用判定と不足知識エントリの追加 → (3) 最終ゴール(解説付き)・中間ゴール・模範解答・段階的ヒントの生成 → (4) スキーマ準拠JSONを `src/content/problems/` に格納 → (5) `npm run validate` 通過まで修正、を一貫して実行する。品質基準は `src/content/README.md` の執筆規約に従う。

---

# 8. 実装フェーズと検証

| フェーズ | 内容 | 検証 |
|---|---|---|
| P0 足場 | Vite+React+TS雛形、KaTeX、Math.tsx、パネル枠CSS | 行列・∀∃を含むLaTeXが正しく描画される |
| P1 データ層 | Zodスキーマ、content/index.ts、validate-content.ts、問題1問+知識5件 | `npm run validate` 通過。壊した参照・不連続レベルでエラーになる |
| P2 演習画面コア | ProblemView+5パネル、段階的ヒント、ゴール進行(メモリのみ) | 1問を通しで解く手動テスト。ヒントが順にしか開かない/解答相当がヒント外に出ない |
| P3 永続化 | localStorage同期、リセット、reducer単体テスト(Vitest) | リロードで進捗復元。version不一致時に安全初期化 |
| P4 一覧・仕上げ | 問題一覧、ルーティング、知識相互リンク、レスポンシブ | 導線の目視確認、モバイル幅(375px) |
| P5 コンテンツ拡充 | 残り2問+知識10件、執筆規約 | validate通過+3問通し演習。「Lv4が完全解答になっていないか」をレビュー |
| P6 配備 | `vite build` → GitHub Pages 等(`base` 設定注意) | 本番URLでスモークテスト |

---

# 9. 将来拡張(仕様8章)への配慮

1. **コンテンツとエンジンの完全分離**: UIは `content/index.ts` の関数API(`getProblem` / `listProblems` / `getKnowledge`)経由でのみデータに触れる(生配列は export しない)。将来「AIによる中間ゴール生成」を入れる際は、`ProblemSchema` を満たすオブジェクトを返すプロバイダ実装の差し替えだけで済む
2. **証明戦略グラフ・パターンライブラリ**: `relatedIds` + `tags` + `kind: "technique"` の拡充によりデータ追加のみで対応可能
3. **学習履歴分析・苦手推定**: 進捗stateにヒント開示レベル・達成状況が揃う。アクションログ蓄積で時系列分析にも対応
4. **バックエンド化**: 永続化は `storage.ts` に隔離済み。サーバ同期はこのモジュール差し替えで対応
