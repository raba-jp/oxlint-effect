import { describe, expect, it } from "bun:test";
import preferGetOrNull from "../src/rules/prefer-get-or-null.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(preferGetOrNull, source);

describe("prefer-get-or-null", () => {
  it("Option.getOrElse(() => null) は違反", () => {
    const reports = run(`
      Option.getOrElse(() => null);
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferGetOrNull");
  });

  it("Option.getOrElse(() => undefined) は違反なし", () => {
    const reports = run(`
      Option.getOrElse(() => undefined);
    `);
    expect(reports).toHaveLength(0);
  });

  it("Option.getOrElse(() => 'default') は違反なし", () => {
    const reports = run(`
      Option.getOrElse(() => "default");
    `);
    expect(reports).toHaveLength(0);
  });

  it("Option.getOrNull (改善後コード) は違反なし", () => {
    const reports = run(`
      Option.getOrNull;
    `);
    expect(reports).toHaveLength(0);
  });

  it("Either.getOrElse(() => null) (Option ではない) は違反なし", () => {
    const reports = run(`
      Either.getOrElse(() => null);
    `);
    expect(reports).toHaveLength(0);
  });
});
