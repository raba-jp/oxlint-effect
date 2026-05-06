import { describe, expect, it } from "bun:test";
import preferMatchTag from "../src/rules/prefer-match-tag.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(preferMatchTag, source);

describe("prefer-match-tag", () => {
  it("Match.when({ _tag: 'Foo' }, ...) は違反", () => {
    const reports = run(`
      Match.when({ _tag: "Foo" }, () => 1);
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferMatchTag");
    expect(reports[0].data.tagValue).toBe("Foo");
  });

  it("Match.when({ _tag: 'X' }) (handler なし) も違反", () => {
    const reports = run(`
      Match.when({ _tag: "X" });
    `);
    expect(reports).toHaveLength(1);
  });

  it("Match.when({ type: 'Foo' }, ...) は違反なし (_tag のみ対象)", () => {
    const reports = run(`
      Match.when({ type: "Foo" }, () => 1);
    `);
    expect(reports).toHaveLength(0);
  });

  it("Match.when({ _tag: 'X', other: 1 }, ...) (複数プロパティ) は違反なし", () => {
    const reports = run(`
      Match.when({ _tag: "X", other: 1 }, () => 1);
    `);
    expect(reports).toHaveLength(0);
  });

  it("Match.tag(...) (改善後コード) は違反なし", () => {
    const reports = run(`
      Match.tag("Foo", () => 1);
    `);
    expect(reports).toHaveLength(0);
  });

  it("Match.when(predicate, ...) (リテラルでない) は違反なし", () => {
    const reports = run(`
      Match.when(isFoo, () => 1);
    `);
    expect(reports).toHaveLength(0);
  });
});
