import { describe, expect, it } from "bun:test";
import noCallWrappingPipe from "../src/rules/no-call-wrapping-pipe.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(noCallWrappingPipe, source);

describe("no-call-wrapping-pipe", () => {
  it("Stream.unwrap(pipe(...)) は違反", () => {
    const reports = run(`
      Stream.unwrap(pipe(a, Effect.map(f)));
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("callWrappingPipe");
  });

  it("単項 Identifier 呼び出しの場合も違反", () => {
    const reports = run(`
      unwrap(pipe(a, b));
    `);
    expect(reports).toHaveLength(1);
  });

  it("CallExpression が callee の場合 (curry) も違反", () => {
    const reports = run(`
      Effect.flatMap(fn)(pipe(a, b));
    `);
    expect(reports).toHaveLength(1);
  });

  it("pipe(pipe(...)) は対象外 (no-nested-pipe で扱う)", () => {
    const reports = run(`
      pipe(pipe(a, b));
    `);
    expect(reports).toHaveLength(0);
  });

  it("引数が複数あるラップは違反なし", () => {
    const reports = run(`
      f(pipe(a, b), other);
    `);
    expect(reports).toHaveLength(0);
  });

  it("pipe ではない引数を渡す呼び出しは違反なし", () => {
    const reports = run(`
      f(g(a, b));
    `);
    expect(reports).toHaveLength(0);
  });

  it("通常の pipe(a, b, f) は違反なし", () => {
    const reports = run(`
      pipe(a, b, Stream.unwrap);
    `);
    expect(reports).toHaveLength(0);
  });

  it("Stream.fromAsyncIterable のように pipe 以外を引数に取る呼び出しは違反なし", () => {
    const reports = run(`
      Stream.fromAsyncIterable(iter, onError);
    `);
    expect(reports).toHaveLength(0);
  });
});
