import { useHashRoute } from "./lib/router";
import { ProgressProvider } from "./state/ProgressContext";
import { KnowledgeIndex } from "./components/KnowledgeIndex";
import { ProblemList } from "./components/ProblemList";
import { ProblemView } from "./components/ProblemView";

export default function App() {
  const route = useHashRoute();

  return (
    <ProgressProvider>
      <header className="app-header">
        <a href="#/" className="brand">
          ProofPond
          <span className="brand-sub">線形代数 証明支援</span>
        </a>
        <nav className="app-nav">
          <a href="#/">問題一覧</a>
          <a href="#/knowledge">知識一覧</a>
        </nav>
      </header>
      <main className="app-main">
        {route.name === "list" && <ProblemList />}
        {route.name === "problem" && <ProblemView problemId={route.id} />}
        {route.name === "knowledge" && <KnowledgeIndex />}
        {route.name === "notfound" && (
          <p className="notfound">
            ページが見つかりません。<a href="#/">問題一覧へ戻る</a>
          </p>
        )}
      </main>
    </ProgressProvider>
  );
}
