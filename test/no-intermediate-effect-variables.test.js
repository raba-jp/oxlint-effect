import { describe, expect, it } from "bun:test";
import noIntermediateEffectVariables from "../src/rules/no-intermediate-effect-variables.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(noIntermediateEffectVariables, source);

describe("no-intermediate-effect-variables", () => {
  it("pipe 結果を 1 回しか使わない中間変数は違反", () => {
    const reports = run(`
      const program = pipe(Effect.succeed(1), Effect.map(x => x + 1));
      pipe(program, Effect.runPromise);
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("noIntermediateVariable");
    expect(reports[0].data.varName).toBe("program");
  });

  it("Effect モジュール呼び出しの結果を MemberExpression 経由で 1 回使う中間変数も違反", () => {
    const reports = run(`
      const job = Effect.succeed(1);
      job.toString();
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].data.varName).toBe("job");
  });

  it("複数回参照される変数は違反なし", () => {
    const reports = run(`
      const program = Effect.succeed(1);
      pipe(program, Effect.runPromise);
      pipe(program, Effect.runFork);
    `);
    expect(reports).toHaveLength(0);
  });

  it("Schema.decode は factory 扱いで対象外", () => {
    const reports = run(`
      const decoded = Schema.decode(MySchema)(input);
      Effect.runPromise(decoded);
    `);
    expect(reports).toHaveLength(0);
  });

  it("execution method (runSync 等) の結果は対象外", () => {
    const reports = run(`
      const result = Effect.runSync(program);
      console.log(result);
    `);
    expect(reports).toHaveLength(0);
  });

  it("pipe(Schema.X, ...) 形式の Schema 合成は対象外", () => {
    const reports = run(`
      const schema = pipe(Schema.String, Schema.minLength(1));
      use(schema);
    `);
    expect(reports).toHaveLength(0);
  });
});
