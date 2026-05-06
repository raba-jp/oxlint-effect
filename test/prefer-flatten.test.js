import { describe, expect, it } from "bun:test";
import preferFlatten from "../src/rules/prefer-flatten.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(preferFlatten, source);

describe("prefer-flatten", () => {
  it("Effect.flatMap(x => x) は違反", () => {
    const reports = run(`
      Effect.flatMap((x) => x);
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferFlatten");
    expect(reports[0].data.effectType).toBe("Effect");
  });

  it("Effect.flatMap(identity) は違反", () => {
    const reports = run(`
      Effect.flatMap(identity);
    `);
    expect(reports).toHaveLength(1);
  });

  it("Option / Array / STM などもサポート", () => {
    for (const ns of ["Option", "Array", "Cause", "STM"]) {
      const reports = run(`
        ${ns}.flatMap((x) => x);
      `);
      expect(reports).toHaveLength(1);
      expect(reports[0].data.effectType).toBe(ns);
    }
  });

  it("Effect.flatMap(x => f(x)) は違反なし", () => {
    const reports = run(`
      Effect.flatMap((x) => f(x));
    `);
    expect(reports).toHaveLength(0);
  });

  it("Effect.flatMap((x, y) => x) (複数引数) は違反なし", () => {
    const reports = run(`
      Effect.flatMap((x, y) => x);
    `);
    expect(reports).toHaveLength(0);
  });
});
