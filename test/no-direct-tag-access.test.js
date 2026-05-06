import { describe, expect, it } from "bun:test";
import noDirectTagAccess from "../src/rules/no-direct-tag-access.js";
import { runRule } from "./run-rule.js";

const run = (source) => runRule(noDirectTagAccess, source);

describe("no-direct-tag-access", () => {
  it("オブジェクトの _tag プロパティへの直接アクセスは違反", () => {
    const reports = run(`
      const tag = either._tag;
    `);
    expect(reports).toHaveLength(1);
    expect(reports[0].messageId).toBe("noDirectTagAccess");
  });

  it("条件式での _tag アクセスも違反", () => {
    const reports = run(`
      function f(option) {
        if (option._tag === "Some") {
          return option.value;
        }
      }
    `);
    expect(reports).toHaveLength(1);
  });

  it("computed access (obj['_tag']) は対象外", () => {
    const reports = run(`
      const tag = obj["_tag"];
    `);
    expect(reports).toHaveLength(0);
  });

  it("オブジェクトリテラルでの _tag 定義は対象外", () => {
    const reports = run(`
      const value = { _tag: "Some", value: 1 };
    `);
    expect(reports).toHaveLength(0);
  });

  it("Either.isLeft 等の type guard は違反なし", () => {
    const reports = run(`
      function f(value) {
        if (Either.isLeft(value)) return value.left;
      }
    `);
    expect(reports).toHaveLength(0);
  });
});
