import { describe, expect, it } from "vitest";
import { progressReducer } from "./progressReducer";
import { initialState, type AppState } from "./storage";

const PID = "w-subspace";

function completeN(state: AppState, n: number, total: number): AppState {
  let s = state;
  for (let i = 1; i <= n; i++) {
    s = progressReducer(s, {
      type: "completeSubgoal",
      problemId: PID,
      subgoalId: `sg${i}`,
      totalSubgoals: total,
    });
  }
  return s;
}

describe("progressReducer", () => {
  it("知識チェックをトグルできる", () => {
    let s = progressReducer(initialState(), {
      type: "toggleKnowledge",
      problemId: PID,
      knowledgeId: "subspace-def",
    });
    expect(s.problems[PID].checkedKnowledgeIds).toEqual(["subspace-def"]);
    s = progressReducer(s, {
      type: "toggleKnowledge",
      problemId: PID,
      knowledgeId: "subspace-def",
    });
    expect(s.problems[PID].checkedKnowledgeIds).toEqual([]);
  });

  it("中間ゴールを順に達成し、全達成で completedAt が付く", () => {
    let s = completeN(initialState(), 2, 3);
    expect(s.problems[PID].completedSubgoalIds).toEqual(["sg1", "sg2"]);
    expect(s.problems[PID].completedAt).toBeUndefined();

    s = completeN(s, 3, 3); // sg1, sg2 は重複無視、sg3 で完了
    expect(s.problems[PID].completedSubgoalIds).toEqual(["sg1", "sg2", "sg3"]);
    expect(s.problems[PID].completedAt).toBeTruthy();
  });

  it("同じ中間ゴールの二重達成は無視される", () => {
    let s = completeN(initialState(), 1, 3);
    s = completeN(s, 1, 3);
    expect(s.problems[PID].completedSubgoalIds).toEqual(["sg1"]);
  });

  it("undoSubgoal で最後の達成を取り消し、completedAt もクリアされる", () => {
    let s = completeN(initialState(), 3, 3);
    expect(s.problems[PID].completedAt).toBeTruthy();
    s = progressReducer(s, { type: "undoSubgoal", problemId: PID });
    expect(s.problems[PID].completedSubgoalIds).toEqual(["sg1", "sg2"]);
    expect(s.problems[PID].completedAt).toBeUndefined();
  });

  it("未達成状態の undoSubgoal は何もしない", () => {
    const s = progressReducer(initialState(), {
      type: "undoSubgoal",
      problemId: PID,
    });
    expect(s.problems[PID].completedSubgoalIds).toEqual([]);
  });

  it("ヒント開示は不可逆(低いレベルの dispatch で下がらない)", () => {
    let s = progressReducer(initialState(), {
      type: "revealHint",
      problemId: PID,
      hintKey: "sg1",
      level: 3,
    });
    expect(s.problems[PID].revealedHints["sg1"]).toBe(3);
    s = progressReducer(s, {
      type: "revealHint",
      problemId: PID,
      hintKey: "sg1",
      level: 1,
    });
    expect(s.problems[PID].revealedHints["sg1"]).toBe(3);
  });

  it("模範解答の開示を記録し、二重開示は無視される", () => {
    let s = progressReducer(initialState(), {
      type: "revealSolution",
      problemId: PID,
      subgoalId: "sg1",
    });
    expect(s.problems[PID].revealedSolutionIds).toEqual(["sg1"]);
    s = progressReducer(s, {
      type: "revealSolution",
      problemId: PID,
      subgoalId: "sg1",
    });
    expect(s.problems[PID].revealedSolutionIds).toEqual(["sg1"]);
  });

  it("resetProblem で該当問題の進捗だけ消える", () => {
    let s = completeN(initialState(), 1, 3);
    s = progressReducer(s, {
      type: "toggleKnowledge",
      problemId: "other",
      knowledgeId: "k1",
    });
    s = progressReducer(s, { type: "resetProblem", problemId: PID });
    expect(s.problems[PID]).toBeUndefined();
    expect(s.problems["other"]).toBeDefined();
  });
});
