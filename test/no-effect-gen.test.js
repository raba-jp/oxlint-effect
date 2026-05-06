import { describe, expect, it } from "bun:test";
import noEffectGen from "../src/rules/no-effect-gen.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(noEffectGen, source);

describe("no-effect-gen", () => {
  describe("既存仕様", () => {
    it("plain な Effect.gen は禁止", () => {
      const reports = run(`
        const program = Effect.gen(function* () {
          yield* something;
        });
      `);
      expect(reports).toHaveLength(1);
      expect(reports[0].messageId).toBe("noEffectGen");
    });

    it("Layer.effect の第 2 引数は許可", () => {
      const reports = run(`
        const layer = Layer.effect(
          Service,
          Effect.gen(function* () {
            return yield* Service;
          })
        );
      `);
      expect(reports).toHaveLength(0);
    });

    it("Layer.scoped の第 2 引数は許可", () => {
      const reports = run(`
        const layer = Layer.scoped(
          Service,
          Effect.gen(function* () {
            return yield* Service;
          })
        );
      `);
      expect(reports).toHaveLength(0);
    });

    it("Context.Service の make プロパティは許可", () => {
      const reports = run(`
        class Foo extends Context.Service<Foo>()("Foo", {
          make: Effect.gen(function* () {
            return { foo: 1 };
          }),
        }) {}
      `);
      expect(reports).toHaveLength(0);
    });

    it("Effect.Service の effect プロパティは許可", () => {
      const reports = run(`
        class Foo extends Effect.Service<Foo>()("Foo", {
          effect: Effect.gen(function* () {
            return { foo: 1 };
          }),
        }) {}
      `);
      expect(reports).toHaveLength(0);
    });

    it("Effect.Service の scoped プロパティは許可", () => {
      const reports = run(`
        class Foo extends Effect.Service<Foo>()("Foo", {
          scoped: Effect.gen(function* () {
            return { foo: 1 };
          }),
        }) {}
      `);
      expect(reports).toHaveLength(0);
    });
  });

  describe("テスト関数のコールバック", () => {
    it("it.effect の concise body は許可", () => {
      const reports = run(`
        it.effect("test", () =>
          Effect.gen(function* () {
            yield* something;
          })
        );
      `);
      expect(reports).toHaveLength(0);
    });

    it("it.effect の block body 単一 return は許可", () => {
      const reports = run(`
        it.effect("test", () => {
          return Effect.gen(function* () {
            yield* something;
          });
        });
      `);
      expect(reports).toHaveLength(0);
    });

    it("it.layer(...)(...) の concise body は許可", () => {
      const reports = run(`
        it.layer(testLayer)("suite", (it) => {
          it.effect("test", () =>
            Effect.gen(function* () {
              yield* something;
            })
          );
        });
      `);
      expect(reports).toHaveLength(0);
    });

    it("it.live の concise body は許可", () => {
      const reports = run(`
        it.live("test", () =>
          Effect.gen(function* () {
            yield* something;
          })
        );
      `);
      expect(reports).toHaveLength(0);
    });

    it("it.scoped の concise body は許可", () => {
      const reports = run(`
        it.scoped("test", () =>
          Effect.gen(function* () {
            yield* something;
          })
        );
      `);
      expect(reports).toHaveLength(0);
    });

    it("it.effect.skip / .only / .fails は許可", () => {
      const reports = run(`
        it.effect.skip("a", () => Effect.gen(function* () {}));
        it.effect.only("b", () => Effect.gen(function* () {}));
        it.effect.fails("c", () => Effect.gen(function* () {}));
      `);
      expect(reports).toHaveLength(0);
    });

    it("it.effect.skipIf(...) / .runIf(...) / .each(...) の戻り値呼び出しも許可", () => {
      const reports = run(`
        it.effect.skipIf(cond)("a", () => Effect.gen(function* () {}));
        it.effect.runIf(cond)("b", () => Effect.gen(function* () {}));
        it.effect.each(cases)("c", () => Effect.gen(function* () {}));
      `);
      expect(reports).toHaveLength(0);
    });

    it("インポートで直接呼ばれた effect / live / scoped も許可", () => {
      const reports = run(`
        effect("a", () => Effect.gen(function* () {}));
        live("b", () => Effect.gen(function* () {}));
        scoped("c", () => Effect.gen(function* () {}));
      `);
      expect(reports).toHaveLength(0);
    });

    it("layer(...)(...) で直接呼ばれた場合も許可", () => {
      const reports = run(`
        layer(testLayer)("suite", (it) => {
          it.effect("test", () =>
            Effect.gen(function* () {
              yield* something;
            })
          );
        });
      `);
      expect(reports).toHaveLength(0);
    });

    it("it.effect の callback 内でネストされた Effect.gen は禁止", () => {
      const reports = run(`
        it.effect("test", () =>
          Effect.gen(function* () {
            yield* Effect.gen(function* () {
              return 1;
            });
          })
        );
      `);
      expect(reports).toHaveLength(1);
      expect(reports[0].messageId).toBe("noEffectGen");
    });

    it("it.effect の callback で pipe 経由の Effect.gen は禁止 (直接の子ではない)", () => {
      const reports = run(`
        it.effect("test", () =>
          pipe(
            Effect.gen(function* () {
              return 1;
            }),
            Effect.flatMap((x) => Effect.succeed(x + 1))
          )
        );
      `);
      expect(reports).toHaveLength(1);
      expect(reports[0].messageId).toBe("noEffectGen");
    });

    it("テスト関数 callback の Effect.gen 内に Layer.effect を含めば内側は許可", () => {
      const reports = run(`
        it.effect("test", () =>
          Effect.gen(function* () {
            const lyr = Layer.effect(
              Service,
              Effect.gen(function* () {
                return { x: 1 };
              })
            );
            yield* lyr;
          })
        );
      `);
      expect(reports).toHaveLength(0);
    });
  });
});
