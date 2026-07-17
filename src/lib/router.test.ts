import { describe, expect, it } from "vitest";
import { parseHash } from "./router";

describe("parseHash", () => {
  it("空・#/ は問題一覧", () => {
    expect(parseHash("")).toEqual({ name: "list" });
    expect(parseHash("#")).toEqual({ name: "list" });
    expect(parseHash("#/")).toEqual({ name: "list" });
  });

  it("#/problems/:id は演習画面", () => {
    expect(parseHash("#/problems/w-subspace")).toEqual({
      name: "problem",
      id: "w-subspace",
    });
  });

  it("#/knowledge は知識一覧", () => {
    expect(parseHash("#/knowledge")).toEqual({ name: "knowledge" });
  });

  it("不明なパスは notfound", () => {
    expect(parseHash("#/nope")).toEqual({ name: "notfound" });
    expect(parseHash("#/problems/")).toEqual({ name: "notfound" });
    expect(parseHash("#/problems/UPPER")).toEqual({ name: "notfound" });
  });
});
