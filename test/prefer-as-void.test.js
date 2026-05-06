import { describe, expect, it } from "bun:test";
import preferAsVoid from "../src/rules/prefer-as-void.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(preferAsVoid, source);

describe("prefer-as-void", () => {
  it("Effect.map(() => undefined) は違反", () => {
    const reports = run(`
      Effect.map(() => undefined);
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferAsVoid");
    expect(reports[0].data.returnValue).toBe("undefined");
  });

  it("Effect.map(() => void 0) は違反", () => {
    const reports = run(`
      Effect.map(() => void 0);
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].data.returnValue).toBe("void 0");
  });

  it("Effect.map(() => {}) は違反", () => {
    const reports = run(`
      Effect.map(() => {});
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].data.returnValue).toBe("{}");
  });

  it("Option / Stream でも検出", () => {
    for (const ns of ["Option", "Stream"]) {
      const reports = run(`
        ${ns}.map(() => undefined);
      `);
      expect(reports).toHaveLength(1);
      expect(reports[0].data.effectType).toBe(ns);
    }
  });

  it("Effect.map(() => x) (定数) は違反なし (prefer-as の領域)", () => {
    const reports = run(`
      Effect.map(() => 42);
    `);
    expect(reports).toHaveLength(0);
  });

  it("Effect.map((x) => undefined) (引数あり) は違反なし", () => {
    const reports = run(`
      Effect.map((x) => undefined);
    `);
    expect(reports).toHaveLength(0);
  });
});
