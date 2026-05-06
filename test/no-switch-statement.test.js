import { describe, expect, it } from "bun:test";
import noSwitchStatement from "../src/rules/no-switch-statement.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(noSwitchStatement, source);

describe("no-switch-statement", () => {
  it("switch 文は違反", () => {
    const reports = run(`
      switch (x) {
        case 1: doA(); break;
        default: doB();
      }
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("noSwitchStatement");
  });

  it("Match.value は違反なし", () => {
    const reports = run(`
      pipe(Match.value(x), Match.when(1, () => "one"), Match.exhaustive);
    `);
    expect(reports).toHaveLength(0);
  });

  it("if/else は対象外", () => {
    const reports = run(`
      if (x === 1) { doA(); } else { doB(); }
    `);
    expect(reports).toHaveLength(0);
  });
});
