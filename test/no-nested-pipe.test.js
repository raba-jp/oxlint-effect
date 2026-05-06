import { describe, expect, it } from "bun:test";
import noNestedPipe from "../src/rules/no-nested-pipe.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(noNestedPipe, source);

describe("no-nested-pipe", () => {
  it("祖先に pipe() がある pipe は違反", () => {
    const reports = run(`
      pipe(
        x,
        Effect.flatMap((u) => pipe(u, Effect.map(f)))
      );
    `);
    expect(reports.length).toBeGreaterThanOrEqual(1);
    expect(reports[0].messageId).toBe("noNestedPipe");
  });

  it("単独の pipe は違反なし", () => {
    const reports = run(`
      pipe(x, f, g);
    `);
    expect(reports).toHaveLength(0);
  });

  it("無関係な兄弟 pipe は違反なし", () => {
    const reports = run(`
      pipe(a, f);
      pipe(b, g);
    `);
    expect(reports).toHaveLength(0);
  });
});
