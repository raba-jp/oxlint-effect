import { describe, expect, it } from "bun:test";
import noPipeInFpCallback from "../src/rules/no-pipe-in-fp-callback.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(noPipeInFpCallback, source);

describe("no-pipe-in-fp-callback", () => {
  it("Effect.flatMap の expression body が pipe(...) なら違反", () => {
    const reports = run(`
      Effect.flatMap((user) => pipe(getOrg(user.orgId), Effect.flatMap(use)));
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("noPipeInFpCallback");
  });

  it("コールバックが式形式 (関数抽出済み) なら違反なし", () => {
    const reports = run(`
      Effect.flatMap(fetchOrgFor);
    `);
    expect(reports).toHaveLength(0);
  });

  it("コールバックが BlockStatement なら no-pipe-in-fp-callback では検出しない", () => {
    const reports = run(`
      Effect.flatMap((user) => {
        return pipe(getOrg(user.orgId), Effect.flatMap(use));
      });
    `);
    expect(reports).toHaveLength(0);
  });

  it("除外メソッド (Effect.gen) は対象外", () => {
    const reports = run(`
      Effect.gen(function* () {
        const v = yield* something;
      });
    `);
    expect(reports).toHaveLength(0);
  });

  it("Stream / Option / Either / Match でも検出", () => {
    for (const ns of ["Stream", "Option", "Either", "Match"]) {
      const reports = run(`
        ${ns}.map((x) => pipe(x, f));
      `);
      expect(reports).toHaveLength(1);
    }
  });
});
