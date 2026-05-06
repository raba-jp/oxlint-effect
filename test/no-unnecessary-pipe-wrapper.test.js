import { describe, expect, it } from "bun:test";
import noUnnecessaryPipeWrapper from "../src/rules/no-unnecessary-pipe-wrapper.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(noUnnecessaryPipeWrapper, source);

describe("no-unnecessary-pipe-wrapper", () => {
  it("(x) => pipe(x, fn) は違反", () => {
    const reports = run(`
      const wrapper = (x) => pipe(x, Effect.map(f));
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("unnecessaryWrapper");
  });

  it("function foo(x) { return pipe(x, fn) } は違反", () => {
    const reports = run(`
      function foo(x) {
        return pipe(x, Effect.map(f));
      }
    `);
    expect(reports).toHaveLength(1);
  });

  it("const foo = function(x) { return pipe(x, fn) } は違反", () => {
    const reports = run(`
      const foo = function(x) {
        return pipe(x, Effect.map(f));
      };
    `);
    expect(reports).toHaveLength(1);
  });

  it("最初の引数が param と一致しない場合は違反なし", () => {
    const reports = run(`
      const wrapper = (x) => pipe(other, Effect.map(f));
    `);
    expect(reports).toHaveLength(0);
  });

  it("複数引数を取るアロー関数は違反なし", () => {
    const reports = run(`
      const wrapper = (x, y) => pipe(x, Effect.map(f));
    `);
    expect(reports).toHaveLength(0);
  });

  it("3 引数以上の pipe は違反なし", () => {
    const reports = run(`
      const wrapper = (x) => pipe(x, f, g);
    `);
    expect(reports).toHaveLength(0);
  });

  it("pipe 以外の関数は違反なし", () => {
    const reports = run(`
      const wrapper = (x) => f(x);
    `);
    expect(reports).toHaveLength(0);
  });
});
