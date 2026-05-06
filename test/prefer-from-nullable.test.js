import { describe, expect, it } from "bun:test";
import preferFromNullable from "../src/rules/prefer-from-nullable.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(preferFromNullable, source);

describe("prefer-from-nullable", () => {
  it("x != null ? Option.some(x) : Option.none() は違反", () => {
    const reports = run(`
      const opt = x != null ? Option.some(x) : Option.none();
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferFromNullable");
  });

  it("x !== undefined ? Option.some(x) : Option.none() は違反", () => {
    const reports = run(`
      const opt = x !== undefined ? Option.some(x) : Option.none();
    `);
    expect(reports).toHaveLength(1);
  });

  it("x == null ? Option.none() : Option.some(x) (反転) も違反", () => {
    const reports = run(`
      const opt = x == null ? Option.none() : Option.some(x);
    `);
    expect(reports).toHaveLength(1);
  });

  it("Option.some の引数が test の左辺と一致しなければ違反なし", () => {
    const reports = run(`
      const opt = x != null ? Option.some(y) : Option.none();
    `);
    expect(reports).toHaveLength(0);
  });

  it("test が null チェックでなければ違反なし", () => {
    const reports = run(`
      const opt = x > 0 ? Option.some(x) : Option.none();
    `);
    expect(reports).toHaveLength(0);
  });

  it("Option.fromNullable(x) (改善後コード) は違反なし", () => {
    const reports = run(`
      const opt = Option.fromNullable(x);
    `);
    expect(reports).toHaveLength(0);
  });
});
