import { describe, expect, it } from "bun:test";
import preferFilterOrFail from "../src/rules/prefer-filter-or-fail.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(preferFilterOrFail, source);

describe("prefer-filter-or-fail", () => {
  it("Effect.flatMap(x => cond ? Effect.fail() : Effect.succeed(x)) は違反", () => {
    const reports = run(`
      Effect.flatMap((user) =>
        user.banned ? Effect.fail(new BannedError()) : Effect.succeed(user)
      );
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("preferFilterOrFail");
  });

  it("Effect.flatMap(x => cond ? Effect.succeed(x) : Effect.fail()) (順序逆) も違反", () => {
    const reports = run(`
      Effect.flatMap((user) =>
        user.active ? Effect.succeed(user) : Effect.fail(new InactiveError())
      );
    `);
    expect(reports).toHaveLength(1);
  });

  it("Effect.succeed が pass-through (引数と異なる identifier) でなければ違反なし", () => {
    const reports = run(`
      Effect.flatMap((user) =>
        user.banned ? Effect.fail(new BannedError()) : Effect.succeed(other)
      );
    `);
    expect(reports).toHaveLength(0);
  });

  it("両方 Effect.succeed なら違反なし", () => {
    const reports = run(`
      Effect.flatMap((user) =>
        cond ? Effect.succeed(user) : Effect.succeed(user)
      );
    `);
    expect(reports).toHaveLength(0);
  });

  it("Effect.flatMap 以外は対象外", () => {
    const reports = run(`
      Effect.map((user) =>
        user.banned ? Effect.fail(new BannedError()) : Effect.succeed(user)
      );
    `);
    expect(reports).toHaveLength(0);
  });

  it("BlockStatement body は対象外 (no-block-in-fp-callback の領域)", () => {
    const reports = run(`
      Effect.flatMap((user) => {
        return user.banned ? Effect.fail(new BannedError()) : Effect.succeed(user);
      });
    `);
    expect(reports).toHaveLength(0);
  });
});
