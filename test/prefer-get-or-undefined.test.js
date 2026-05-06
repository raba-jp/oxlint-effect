import { describe, expect, it } from "bun:test";
import preferGetOrUndefined from "../src/rules/prefer-get-or-undefined.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(preferGetOrUndefined, source);

describe("prefer-get-or-undefined", () => {
  it("Option.getOrElse(() => undefined) は違反", () => {
    const reports = run(`
      Option.getOrElse(() => undefined);
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferGetOrUndefined");
  });

  it("Option.getOrElse(() => null) は違反なし", () => {
    const reports = run(`
      Option.getOrElse(() => null);
    `);
    expect(reports).toHaveLength(0);
  });

  it("Option.getOrUndefined (改善後コード) は違反なし", () => {
    const reports = run(`
      Option.getOrUndefined;
    `);
    expect(reports).toHaveLength(0);
  });

  it("Either.getOrElse(() => undefined) (Option ではない) は違反なし", () => {
    const reports = run(`
      Either.getOrElse(() => undefined);
    `);
    expect(reports).toHaveLength(0);
  });
});
