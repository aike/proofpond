import katex from "katex";
import { useMemo, type ReactNode } from "react";

/**
 * $...$ / $$...$$ を含む混在テキストを、地の文とKaTeXレンダリング結果の
 * 並びとして描画する。改行(\n)は CSS の white-space: pre-wrap で反映される。
 */

const SPLIT_PATTERN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g;

function renderTex(tex: string, displayMode: boolean): string {
  return katex.renderToString(tex, {
    displayMode,
    throwOnError: false, // 不正なLaTeXはエラー表示せず赤字でソースを出す(KaTeX既定)
    strict: false,
  });
}

export function MathText({ text }: { text: string }) {
  const nodes = useMemo<ReactNode[]>(() => {
    return text.split(SPLIT_PATTERN).map((part, i) => {
      if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4) {
        return (
          <span
            key={i}
            className="math-display"
            dangerouslySetInnerHTML={{ __html: renderTex(part.slice(2, -2), true) }}
          />
        );
      }
      if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
        return (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: renderTex(part.slice(1, -1), false) }}
          />
        );
      }
      return part === "" ? null : <span key={i}>{part}</span>;
    });
  }, [text]);

  return <span className="mathtext">{nodes}</span>;
}
