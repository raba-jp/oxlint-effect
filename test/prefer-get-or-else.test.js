import { describe, expect, it } from "bun:test";
import preferGetOrElse from "../src/rules/prefer-get-or-else.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(preferGetOrElse, source);

describe("prefer-get-or-else", () => {
  it("Option.isSome(opt) ? opt.value : default は違反", () => {
    const reports = run(`
      const v = Option.isSome(opt) ? opt.value : "default";
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferGetOrElse");
  });

  it("Option.isSome 以外の test は違反なし", () => {
    const reports = run(`
      const v = cond ? opt.value : "default";
    `);
    expect(reports).toHaveLength(0);
  });

  it("consequent が opt.value でなければ違反なし", () => {
    const reports = run(`
      const v = Option.isSome(opt) ? other.value : "default";
    `);
    expect(reports).toHaveLength(0);
  });

  it("consequent が .value ではないなら違反なし", () => {
    const reports = run(`
      const v = Option.isSome(opt) ? opt.something : "default";
    `);
    expect(reports).toHaveLength(0);
  });

  it("pipe(opt, Option.getOrElse(...)) (改善後コード) は違反なし", () => {
    const reports = run(`
      const v = pipe(opt, Option.getOrElse(() => "default"));
    `);
    expect(reports).toHaveLength(0);
  });
});
