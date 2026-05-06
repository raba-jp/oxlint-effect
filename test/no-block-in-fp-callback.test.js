import { describe, expect, it } from "bun:test";
import noBlockInFpCallback from "../src/rules/no-block-in-fp-callback.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(noBlockInFpCallback, source);

describe("no-block-in-fp-callback", () => {
  it("Effect.flatMap のコールバックが BlockStatement なら違反", () => {
    const reports = run(`
      Effect.flatMap(x => {
        if (x) return Effect.fail("e");
        return Effect.succeed(x);
      });
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("noBlockInFpCallback");
    expect(reports[0].nodeType).toBe("BlockStatement");
  });

  it("単一 ReturnStatement は auto-fix 対象 (報告は出る)", () => {
    const reports = run(`
      Effect.map(x => {
        return x + 1;
      });
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("noBlockInFpCallback");
  });

  it("式形式コールバックは違反なし", () => {
    const reports = run(`
      Effect.map(x => x + 1);
    `);
    expect(reports).toHaveLength(0);
  });

  it("Stream / Option / Either / Match の各 namespace でも検出", () => {
    for (const ns of ["Stream", "Option", "Either", "Match"]) {
      const reports = run(`
        ${ns}.map(x => {
          return x;
        });
      `);
      expect(reports).toHaveLength(1);
    }
  });

  it("除外メソッド (Effect.gen 等) のコールバックは対象外", () => {
    const reports = run(`
      Effect.gen(function* () {
        yield* something;
      });
    `);
    expect(reports).toHaveLength(0);
  });

  it("Effect.acquireRelease の release コールバックは除外", () => {
    const reports = run(`
      Effect.acquireRelease(acquire, (resource) => {
        cleanup(resource);
        return Effect.void;
      });
    `);
    expect(reports).toHaveLength(0);
  });

  it("非対象の namespace (e.g. Array.map) は違反なし", () => {
    const reports = run(`
      Array.map(items, (x) => {
        return x;
      });
    `);
    expect(reports).toHaveLength(0);
  });
});
