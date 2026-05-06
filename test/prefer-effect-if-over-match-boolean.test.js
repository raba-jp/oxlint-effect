import { describe, expect, it } from "bun:test";
import preferEffectIfOverMatchBoolean from "../src/rules/prefer-effect-if-over-match-boolean.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(preferEffectIfOverMatchBoolean, source);

describe("prefer-effect-if-over-match-boolean", () => {
  it("pipe(BinaryExpression, Match.value) は違反", () => {
    const reports = run(`
      pipe(x === 1, Match.value, Match.when(true, () => "yes"), Match.exhaustive);
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("useEffectIf");
  });

  it("pipe(LogicalExpression, Match.value) は違反", () => {
    const reports = run(`
      pipe(a && b, Match.value, Match.when(true, () => "yes"), Match.exhaustive);
    `);
    expect(reports).toHaveLength(1);
  });

  it("Match.value(BinaryExpression) は違反", () => {
    const reports = run(`
      Match.value(x === 1);
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("useEffectIf");
  });

  it("Match.value(UnaryExpression !) は違反", () => {
    const reports = run(`
      Match.value(!flag);
    `);
    expect(reports).toHaveLength(1);
  });

  it("Match.value(stringValue) (boolean ではない) は違反なし", () => {
    const reports = run(`
      Match.value(name);
    `);
    expect(reports).toHaveLength(0);
  });

  it("pipe(union, Match.value) は違反なし", () => {
    const reports = run(`
      pipe(value, Match.value, Match.tag("Foo", () => 1), Match.exhaustive);
    `);
    expect(reports).toHaveLength(0);
  });
});
