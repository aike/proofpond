# ProofPond

線形代数の**証明問題**を、段階的なヒントと中間ゴールで支援する学習アプリ。
現状は証明問題学習支援システムのフレームワーク試作という位置付けで、コンテンツはまだ少なめです。

**公開サイト: https://aike.github.io/proofpond/**

「証明問題を前にして何から手を付ければいいか分からない」学習者向けに、答えを丸写しするのではなく**自力で証明を完成させる**ことを助ける構成になっています。

## 学習の流れ

1つの問題は次の要素で構成され、問題ページに上から順に表示されます。

1. **問題文** — 示すべき命題
2. **必要知識** — この問題で使う定義・定理・考え方のカード。確認したものにチェックを付けられる
3. **最終ゴール** — 問題文を「検証可能な形」に翻訳した命題。「なぜこれを示せば証明になるのか(why)」「どうすれば思いつけるのか(howToFind)」の解説付き
4. **中間ゴール** — 証明を「手が動く単位」に分けたステップ(1問あたり3〜6個)。達成したら自分でチェックして進める
5. **ヒント** — 現在の中間ゴールに対する段階的ヒント(最大4レベル)。レベル1「方向性のみ」からレベル4「ほぼ完成形」まで、必要な分だけ開示できる
6. **模範解答** — 各中間ゴールごとの清書された証明文。要求時のみ表示

進捗(チェック・ヒント開示状況)はブラウザの localStorage に保存されます。サーバは不要です。

## 技術構成

- **React 18 + TypeScript + Vite** — SPA。ルーティングはハッシュベース(`#/`、`#/problem/<id>`、`#/knowledge`)なのでサーバ設定不要
- **KaTeX** — 数式レンダリング(`$...$` / `$$...$$`)
- **Zod** — コンテンツ(問題・知識)のスキーマ検証
- **Vitest** — ユニットテスト

コンテンツはすべて `src/content/` 配下のJSONファイルで、ビルド時にスキーマ検証されます。

## 開発

```bash
npm install
npm run dev        # 開発サーバ起動
npm test           # テスト実行
npm run validate   # コンテンツのスキーマ検証・参照整合性チェック
npm run build      # 本番ビルド(validate + 型チェック込み)
```

## ディレクトリ構成

```
src/
├── content/            # 学習コンテンツ(JSON)
│   ├── problems/       #   問題(1ファイル1問題)
│   ├── knowledge/      #   知識エントリ(分野ごとに1ファイル)
│   ├── schema.ts       #   Zodスキーマ(問題・知識・ヒントの構造定義)
│   ├── validate.ts     #   参照整合性などの検証ロジック
│   └── README.md       #   コンテンツ執筆規約(ヒントの粒度・LaTeX記法など)
├── components/         # UI(問題一覧・問題ビュー・知識一覧・各パネル)
├── state/              # 進捗管理(reducer + localStorage永続化)
└── lib/                # ハッシュルーター
```

## コンテンツの追加

問題・知識エントリの書き方(ヒントの粒度、模範解答の役割分担、LaTeXの記法など)は [`src/content/README.md`](src/content/README.md) を参照してください。追加後は `npm run validate` で検証できます。

### add-problem スキル(Claude Code)

このリポジトリには問題追加用の [Claude Code](https://claude.com/claude-code) スキル([`.claude/skills/add-problem/SKILL.md`](.claude/skills/add-problem/SKILL.md))が同梱されています。Claude Code 上で

```
/add-problem 像が部分空間になるやつ
```

のようにざっくりした問題のアイデアを渡すと、次を自動で行います。

1. 問題文を大学初年次〜中級レベルの証明問題として清書
2. 最終ゴール(why / howToFind の解説付き)・中間ゴール・各ステップの模範解答・段階的ヒントを生成
3. 必要知識のうち既存の知識エントリを再利用し、足りないものだけ `src/content/knowledge/` に新規作成
4. スキーマ準拠のJSONを `src/content/problems/` に格納し、`npm run validate` が通るまで検証・修正

「問題を追加」「新しい問題」のような自然な依頼でも起動します。手で書く場合も、このスキルが参照している執筆規約とスキーマ([`src/content/schema.ts`](src/content/schema.ts))が正となる点は同じです。

## デプロイ

`main` ブランチにpushすると、GitHub Actions([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))がコンテンツ検証 → 型チェック → ビルド → GitHub Pages公開まで自動で行います。

## License

Copyright (c) aike (@aike1000)

The source code of this project is licensed under the MIT License, **except for the files under `src/content/problems/`**, which are excluded from the MIT License. All rights to those files are reserved.
