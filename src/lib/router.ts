import { useSyncExternalStore } from "react";

/**
 * 依存ゼロの軽量ハッシュルーティング。
 * 画面は3つだけなのでライブラリは使わない。ハッシュ方式なので
 * 静的ホスティングでのリロード404問題も起きない。
 */

export type Route =
  | { name: "list" }
  | { name: "problem"; id: string }
  | { name: "knowledge" }
  | { name: "notfound" };

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, "");
  if (path === "" || path === "/") return { name: "list" };
  const problemMatch = path.match(/^\/problems\/([a-z0-9-]+)$/);
  if (problemMatch) return { name: "problem", id: problemMatch[1] };
  if (path === "/knowledge") return { name: "knowledge" };
  return { name: "notfound" };
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

export function useHashRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parseHash(hash);
}
