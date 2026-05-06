import { describe, expect, it } from "bun:test";
import preferAndThen from "../src/rules/prefer-andThen.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(preferAndThen, source);

describe("prefer-andThen", () => {
  it("Effect.flatMap(() => effect) は違反", () => {
    const reports = run(`
      Effect.flatMap(() => Effect.succeed(1));
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferAndThen");
    expect(reports[0].data.effectType).toBe("Effect");
  });

  it("Effect.flatMap((x) => Effect.succeed(1)) で x を使わなければ違反", () => {
    const reports = run(`
      Effect.flatMap((unused) => Effect.succeed(1));
    `);
    expect(reports).toHaveLength(1);
  });

  it("引数を使うコールバックは違反なし", () => {
    const reports = run(`
      Effect.flatMap((x) => Effect.succeed(x + 1));
    `);
    expect(reports).toHaveLength(0);
  });

  it("Option / Stream / STM もサポート", () => {
    for (const ns of ["Option", "Stream", "STM"]) {
      const reports = run(`
        ${ns}.flatMap(() => ${ns}.succeed(1));
      `);
      expect(reports).toHaveLength(1);
      expect(reports[0].data.effectType).toBe(ns);
    }
  });

  it("非対応の namespace は違反なし", () => {
    const reports = run(`
      Array.flatMap(() => [1]);
    `);
    expect(reports).toHaveLength(0);
  });
});
