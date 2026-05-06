import { describe, expect, it } from "bun:test";
import noNestedPipes from "../src/rules/no-nested-pipes.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(noNestedPipes, source);

describe("no-nested-pipes", () => {
  it("pipe の引数として直接 pipe を渡すのは違反", () => {
    const reports = run(`
      pipe(pipe(x, f), g);
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("noNestedPipes");
  });

  it("pipe の引数の関数 callback 内の pipe は違反なし", () => {
    const reports = run(`
      pipe(
        x,
        Effect.flatMap((u) => pipe(u, f))
      );
    `);
    expect(reports).toHaveLength(0);
  });

  it("単独の pipe は違反なし", () => {
    const reports = run(`
      pipe(a, b, c);
    `);
    expect(reports).toHaveLength(0);
  });
});
