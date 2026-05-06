import { describe, expect, it } from "bun:test";
import noMethodPipe from "../src/rules/no-method-pipe.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(noMethodPipe, source);

describe("no-method-pipe", () => {
  it(".pipe() メソッド呼び出しは違反", () => {
    const reports = run(`
      Effect.succeed(1).pipe(Effect.map(x => x + 1));
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("noMethodPipe");
  });

  it("関数形式の pipe(...) は違反なし", () => {
    const reports = run(`
      pipe(Effect.succeed(1), Effect.map(x => x + 1));
    `);
    expect(reports).toHaveLength(0);
  });

  it("チェーンされた .pipe() も検出", () => {
    const reports = run(`
      a.pipe(f).pipe(g);
    `);
    expect(reports).toHaveLength(2);
  });

  it("pipe 以外のメソッドチェーンは違反なし", () => {
    const reports = run(`
      arr.map(x => x + 1).filter(y => y > 0);
    `);
    expect(reports).toHaveLength(0);
  });
});
