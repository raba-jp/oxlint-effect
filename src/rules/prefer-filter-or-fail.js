/**
 * Effect.flatMap で「成功側がそのまま値を通す pass-through」かつ「失敗側で fail する」
 * 三項分岐を検出し、Effect.filterOrFail への置き換えを促す。
 *
 * BlockStatement 内の `if` を使った早期 return は no-block-in-fp-callback で扱う。
 *
 * @see .claude/rules/typescript.md
 */

/** `Effect.flatMap` の CallExpression かを判定する。 */
export function isEffectFlatMapCall(node) {
  if (node?.type !== "CallExpression") return false;
  const callee = node.callee;
  return (
    callee?.type === "MemberExpression" &&
    !callee.computed &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "Effect" &&
    callee.property?.type === "Identifier" &&
    callee.property.name === "flatMap"
  );
}

/** `Effect.fail(...)` の CallExpression かを判定する。 */
export function isEffectFailCall(node) {
  if (node?.type !== "CallExpression") return false;
  const callee = node.callee;
  return (
    callee?.type === "MemberExpression" &&
    !callee.computed &&
    callee.object?.type === "Identifier" &&
    callee.object.name === "Effect" &&
    callee.property?.type === "Identifier" &&
    callee.property.name === "fail"
  );
}

/** `Effect.succeed(<identifierName>)` の CallExpression かを判定する。 */
export function isEffectSucceedPassThrough(node, identifierName) {
  if (node?.type !== "CallExpression") return false;
  const callee = node.callee;
  if (
    callee?.type !== "MemberExpression" ||
    callee.computed ||
    callee.object?.type !== "Identifier" ||
    callee.object.name !== "Effect" ||
    callee.property?.type !== "Identifier" ||
    callee.property.name !== "succeed"
  ) {
    return false;
  }
  const args = node.arguments;
  if (!Array.isArray(args) || args.length !== 1) return false;
  const arg = args[0];
  return arg?.type === "Identifier" && arg.name === identifierName;
}

/** ArrowFunctionExpression / FunctionExpression の最初のパラメータの Identifier 名を取得する。 */
export function getFirstParamName(callback) {
  if (callback?.type !== "ArrowFunctionExpression" && callback?.type !== "FunctionExpression") return null;
  const param = callback.params?.[0];
  if (param?.type !== "Identifier") return null;
  return param.name;
}

/** @type {import("@oxlint/plugins").CreateOnceRule} */
const preferFilterOrFail = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer `Effect.filterOrFail` over `Effect.flatMap(x => cond ? Effect.fail(...) : Effect.succeed(x))` pass-through ternary patterns.",
    },
    schema: [],
    messages: {
      preferFilterOrFail:
        "Effect.flatMap の pass-through 三項分岐は Effect.filterOrFail で書けます。\n\n  // Bad\n  Effect.flatMap(user =>\n    user.banned ? Effect.fail(new BannedError()) : Effect.succeed(user)\n  )\n\n  // Good\n  Effect.filterOrFail(\n    user => !user.banned,\n    () => new BannedError(),\n  )",
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        if (!isEffectFlatMapCall(node)) return;
        const callback = node.arguments?.[0];
        if (callback?.type !== "ArrowFunctionExpression" && callback?.type !== "FunctionExpression") return;

        const paramName = getFirstParamName(callback);
        if (paramName === null) return;

        const body = callback.body;
        if (body?.type !== "ConditionalExpression") return;

        const { consequent, alternate } = body;
        const passThroughInConsequent =
          isEffectSucceedPassThrough(consequent, paramName) && isEffectFailCall(alternate);
        const passThroughInAlternate = isEffectSucceedPassThrough(alternate, paramName) && isEffectFailCall(consequent);

        if (passThroughInConsequent || passThroughInAlternate) {
          context.report({
            node: body,
            messageId: "preferFilterOrFail",
          });
        }
      },
    };
  },
};

export default preferFilterOrFail;
