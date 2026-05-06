import { describe, expect, it } from "bun:test";
import preferAs from "../src/rules/prefer-as.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(preferAs, source);

describe("prefer-as", () => {
  it("Effect.map(() => 42) は違反", () => {
    const reports = run(`
      Effect.map(() => 42);
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferAs");
    expect(reports[0].data.effectType).toBe("Effect");
  });

  it("Effect.map(() => 'hello') は違反", () => {
    const reports = run(`
      Effect.map(() => "hello");
    `);
    expect(reports).toHaveLength(1);
  });

  it("Effect.map(() => undefined) (void return) は違反なし", () => {
    const reports = run(`
      Effect.map(() => undefined);
    `);
    expect(reports).toHaveLength(0);
  });

  it("Effect.map(() => {}) (空 block) は違反なし", () => {
    const reports = run(`
      Effect.map(() => {});
    `);
    expect(reports).toHaveLength(0);
  });

  it("Effect.map((x) => 42) (引数あり) は違反なし", () => {
    const reports = run(`
      Effect.map((x) => 42);
    `);
    expect(reports).toHaveLength(0);
  });

  it("Effect.map(() => { return 1; }) (block) は違反なし", () => {
    const reports = run(`
      Effect.map(() => { return 1; });
    `);
    expect(reports).toHaveLength(0);
  });
});
