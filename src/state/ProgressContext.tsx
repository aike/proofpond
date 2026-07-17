import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  type ReactNode,
} from "react";
import { progressReducer, type ProgressAction } from "./progressReducer";
import {
  EMPTY_PROGRESS,
  appendActionLog,
  loadState,
  saveState,
  type AppState,
  type ProblemProgress,
} from "./storage";

interface ProgressContextValue {
  state: AppState;
  dispatch: (action: ProgressAction) => void;
}

const Ctx = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(progressReducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const dispatch = useCallback((action: ProgressAction) => {
    appendActionLog(action);
    rawDispatch(action);
  }, []);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useProgress は ProgressProvider の内側で使ってください");
  }
  return ctx;
}

export function useProblemProgress(problemId: string): ProblemProgress {
  return useProgress().state.problems[problemId] ?? EMPTY_PROGRESS;
}
