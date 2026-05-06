import { getCallbackArgs, isExcludedMethod, isFpNamespaceCall } from "./_utils/fp-callback.js";

/**
 * Effect / Stream / Option / Either / Match のコールバック body が BlockStatement (`{ ... }`)
 * になっているパターンを検出し、式形式 (`x => expr`) への書き換えを促す。
 *
 * 単一 ReturnStatement のみの BlockStatement (`x => { return expr }`) は
 * auto-fix で式形式に置換する。複数文や命令文を含む場合は提案メッセージのみ。
 *
 * 条件分岐は Match.value / Effect.if / Effect.filterOrFail、ループは Effect.forEach / Stream を
 * 使い、複雑なロジックは関数抽出する。
 */

/** BlockStatement が単一 ReturnStatement (引数あり) のみで構成されているかを判定する。 */
export function isSingleReturnBlock(body) {
  if (body?.type !== "BlockStatement") return false;
  if (!globalThis.Array.isArray(body.body) || body.body.length !== 1) return false;
  const stmt = body.body[0];
  return stmt?.type === "ReturnStatement" && stmt.argument != null;
}

/**
 * Arrow expression body として安全に置けるテキストにする。
 * ObjectExpression は `{ ... }` がブロックとして parse されてしまうため `(...)` で包む。
 */
export function wrapForExpressionBody(arg, raw) {
  return arg?.type === "ObjectExpression" ? `(${raw})` : raw;
}

/** @type {import("@oxlint/plugins").CreateOnceRule} */
const noBlockInFpCallback = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Forbid BlockStatement bodies in Effect/Stream/Option/Either/Match callbacks. Use expression-form callbacks; use Match.value / Effect.if / Effect.filterOrFail / Effect.forEach / Stream for control flow.",
    },
    schema: [],
    fixable: "code",
    messages: {
      noBlockInFpCallback:
        '{{namespace}}.{{method}} のコールバックは式形式で書いてください。条件分岐は Match.value / Effect.if / Effect.when / Effect.filterOrFail、ループは Effect.forEach / Stream を使ってください。複雑なロジックは関数に抽出します（抽出先も pipe + 宣言的合成で書く）。\n\n  // Bad\n  Effect.flatMap(x => {\n    if (cond(x)) return Effect.fail(...)\n    return Effect.succeed(...)\n  })\n\n  // Good (Effect.if)\n  Effect.flatMap(x =>\n    Effect.if(cond(x), {\n      onTrue: () => Effect.fail(...),\n      onFalse: () => Effect.succeed(...),\n    }),\n  )\n\n  // Good (Match.value)\n  Effect.flatMap(x =>\n    pipe(\n      Match.value(x),\n      Match.when({ _tag: "Foo" }, () => ...),\n      Match.exhaustive,\n    ),\n  )',
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        const ns = isFpNamespaceCall(node);
        if (!ns) return;
        if (isExcludedMethod(ns.namespace, ns.method)) return;

        for (const callback of getCallbackArgs(node)) {
          const body = callback.body;
          if (body?.type !== "BlockStatement") continue;

          // NOTE: BlockStatement 内に WHY コメントが残っている場合 fix で消失するため auto-fix しない
          const hasComments = (context.sourceCode.getCommentsInside?.(body) ?? []).length > 0;

          if (isSingleReturnBlock(body) && !hasComments) {
            context.report({
              node: body,
              messageId: "noBlockInFpCallback",
              data: { namespace: ns.namespace, method: ns.method },
              fix(fixer) {
                const arg = body.body[0].argument;
                const raw = context.sourceCode.getText(arg);
                return fixer.replaceText(body, wrapForExpressionBody(arg, raw));
              },
            });
          } else {
            context.report({
              node: body,
              messageId: "noBlockInFpCallback",
              data: { namespace: ns.namespace, method: ns.method },
            });
          }
        }
      },
    };
  },
};

export default noBlockInFpCallback;
