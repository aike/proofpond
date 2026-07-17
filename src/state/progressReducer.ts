import { EMPTY_PROGRESS, type AppState, type ProblemProgress } from "./storage";

export type ProgressAction =
  | { type: "toggleKnowledge"; problemId: string; knowledgeId: string }
  | {
      type: "completeSubgoal";
      problemId: string;
      subgoalId: string;
      totalSubgoals: number;
    }
  | { type: "undoSubgoal"; problemId: string }
  | { type: "revealHint"; problemId: string; hintKey: string; level: number }
  | { type: "revealSolution"; problemId: string; subgoalId: string }
  | { type: "resetProblem"; problemId: string };

function updateProblem(
  state: AppState,
  problemId: string,
  update: (p: ProblemProgress) => ProblemProgress,
): AppState {
  const current = state.problems[problemId] ?? EMPTY_PROGRESS;
  return {
    ...state,
    problems: { ...state.problems, [problemId]: update(current) },
  };
}

export function progressReducer(
  state: AppState,
  action: ProgressAction,
): AppState {
  switch (action.type) {
    case "toggleKnowledge":
      return updateProblem(state, action.problemId, (p) => ({
        ...p,
        checkedKnowledgeIds: p.checkedKnowledgeIds.includes(action.knowledgeId)
          ? p.checkedKnowledgeIds.filter((id) => id !== action.knowledgeId)
          : [...p.checkedKnowledgeIds, action.knowledgeId],
      }));

    case "completeSubgoal":
      return updateProblem(state, action.problemId, (p) => {
        if (p.completedSubgoalIds.includes(action.subgoalId)) return p;
        const completed = [...p.completedSubgoalIds, action.subgoalId];
        return {
          ...p,
          completedSubgoalIds: completed,
          completedAt:
            completed.length >= action.totalSubgoals
              ? new Date().toISOString()
              : p.completedAt,
        };
      });

    case "undoSubgoal":
      return updateProblem(state, action.problemId, (p) => {
        if (p.completedSubgoalIds.length === 0) return p;
        return {
          ...p,
          completedSubgoalIds: p.completedSubgoalIds.slice(0, -1),
          completedAt: undefined,
        };
      });

    case "revealHint":
      return updateProblem(state, action.problemId, (p) => ({
        ...p,
        revealedHints: {
          ...p.revealedHints,
          // 開示は不可逆: 既に高いレベルまで開いていたら下げない
          [action.hintKey]: Math.max(
            p.revealedHints[action.hintKey] ?? 0,
            action.level,
          ),
        },
      }));

    case "revealSolution":
      return updateProblem(state, action.problemId, (p) => {
        // 開示は不可逆(ヒントと同様)
        if (p.revealedSolutionIds.includes(action.subgoalId)) return p;
        return {
          ...p,
          revealedSolutionIds: [...p.revealedSolutionIds, action.subgoalId],
        };
      });

    case "resetProblem": {
      const problems = { ...state.problems };
      delete problems[action.problemId];
      return { ...state, problems };
    }
  }
}
