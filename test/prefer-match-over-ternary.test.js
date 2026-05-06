import { describe, expect, it } from "bun:test";
import preferMatchOverTernary from "../src/rules/prefer-match-over-ternary.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(preferMatchOverTernary, source);

describe("prefer-match-over-ternary", () => {
  it("Effect 呼び出し選択の三項 (boolean condition) は useEffectIf 違反", () => {
    const reports = run(`
      const result = isReady ? Effect.succeed(1) : Effect.fail(new Error());
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("useEffectIf");
  });

  it("Effect コンストラクタ内部の三項 (非単純) は useMatchInEffectConstructor 違反", () => {
    const reports = run(`
      Effect.succeed(a > b ? doA() : doB());
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("useMatchInEffectConstructor");
  });

  it("単純なリテラル等価比較は対象外", () => {
    const reports = run(`
      const x = name === "alice" ? Effect.succeed(1) : Effect.fail(new Error());
    `);
    expect(reports).toHaveLength(0);
  });

  it("Effect 関係ない三項 (return 等にも入っていない) は対象外", () => {
    const reports = run(`
      function f() {
        cond ? doA() : doB();
      }
    `);
    expect(reports).toHaveLength(0);
  });

  it("非 Effect 呼び出し同士の三項 (return 内) は useMatchInstead 違反", () => {
    const reports = run(`
      function pick() {
        return cond ? doA() : doB();
      }
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("useMatchInstead");
  });
});
