import { describe, expect, it } from "bun:test";
import preferMatchOverConditionals from "../src/rules/prefer-match-over-conditionals.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(preferMatchOverConditionals, source);

describe("prefer-match-over-conditionals", () => {
  it("Effect.flatMap callback で if (x._tag === 'Foo') は違反", () => {
    const reports = run(`
      Effect.flatMap((x) => {
        if (x._tag === "Foo") {
          return doFoo();
        }
        return doOther();
      });
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("useMatchInstead");
    expect(reports[0].data.property).toBe("_tag");
    expect(reports[0].data.tagValue).toBe("Foo");
  });

  it("type / kind / variant でも検出", () => {
    for (const prop of ["type", "kind", "variant"]) {
      const reports = run(`
        Effect.map((x) => {
          if (x.${prop} === "A") {
            return 1;
          }
          return 2;
        });
      `);
      expect(reports).toHaveLength(1);
      expect(reports[0].data.property).toBe(prop);
    }
  });

  it("逆順 ('A' === x._tag) も検出", () => {
    const reports = run(`
      Effect.flatMap((x) => {
        if ("Foo" === x._tag) {
          return doFoo();
        }
        return doOther();
      });
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].data.tagValue).toBe("Foo");
  });

  it("if 文も return も含まない body は違反なし", () => {
    const reports = run(`
      Effect.flatMap((x) => {
        doSomething(x);
      });
    `);
    expect(reports).toHaveLength(0);
  });

  it("if 文の test が discriminator チェックでなければ違反なし", () => {
    const reports = run(`
      Effect.flatMap((x) => {
        if (x.count > 0) {
          return doSomething();
        }
        return done();
      });
    `);
    expect(reports).toHaveLength(0);
  });

  it("Effect 以外のメソッドは対象外", () => {
    const reports = run(`
      Effect.scoped((x) => {
        if (x._tag === "Foo") {
          return doFoo();
        }
        return doOther();
      });
    `);
    expect(reports).toHaveLength(0);
  });

  it("Match を使った改善後コードは違反なし", () => {
    const reports = run(`
      Effect.flatMap((x) =>
        pipe(Match.value(x), Match.tag("Foo", () => doFoo()), Match.exhaustive)
      );
    `);
    expect(reports).toHaveLength(0);
  });
});
