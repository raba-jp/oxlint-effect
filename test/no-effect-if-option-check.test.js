import { describe, expect, it } from "bun:test";
import noEffectIfOptionCheck from "../src/rules/no-effect-if-option-check.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(noEffectIfOptionCheck, source);

describe("no-effect-if-option-check", () => {
  it("Effect.if(Option.isSome(...)) は違反", () => {
    const reports = run(`
      Effect.if(Option.isSome(opt), { onTrue, onFalse });
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("noEffectIfOptionCheck");
    expect(reports[0].data.checkFunction).toBe("Option.isSome");
  });

  it("Effect.if(Option.isNone(...)) は違反", () => {
    const reports = run(`
      Effect.if(Option.isNone(opt), { onTrue, onFalse });
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].data.checkFunction).toBe("Option.isNone");
  });

  it("Effect.if(other) は違反なし", () => {
    const reports = run(`
      Effect.if(condition, { onTrue, onFalse });
    `);
    expect(reports).toHaveLength(0);
  });

  it("Effect.if(Either.isLeft(...)) は違反なし", () => {
    const reports = run(`
      Effect.if(Either.isLeft(e), { onTrue, onFalse });
    `);
    expect(reports).toHaveLength(0);
  });

  it("Option.match(...) (改善後コード) は違反なし", () => {
    const reports = run(`
      pipe(opt, Option.match({ onNone: () => Effect.void, onSome: (v) => use(v) }));
    `);
    expect(reports).toHaveLength(0);
  });
});
