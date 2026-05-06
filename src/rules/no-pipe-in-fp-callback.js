import { getCallbackArgs, isExcludedMethod, isFpNamespaceCall } from "./_utils/fp-callback.js";

/**
 * Effect / Stream / Option / Either / Match のコールバック内で `pipe(...)` を直接の expression body
 * として呼ぶパターンを検出し、関数抽出または Effect.Do + Effect.bind での平坦化を促す。
 *
 * BlockStatement 内の pipe は no-block-in-fp-callback が BlockStatement 自体を違反として捕まえる。
 *
 * @see .claude/rules/typescript.md
 */

/** スタンドアロン `pipe(...)` の CallExpression かを判定する。 */
export function isStandalonePipeCall(node) {
  return node?.type === "CallExpression" && node.callee?.type === "Identifier" && node.callee.name === "pipe";
}

/** @type {import("@oxlint/plugins").CreateOnceRule} */
const noPipeInFpCallback = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Forbid `pipe(...)` directly as the body of an Effect/Stream/Option/Either/Match callback. Use Effect.Do + Effect.bind or extract a named function instead.",
    },
    schema: [],
    messages: {
      noPipeInFpCallback:
        '{{namespace}}.{{method}} のコールバック内で pipe をネストせず、関数を抽出するか Effect.Do + Effect.bind で平坦化してください。\n\n  // Bad\n  Effect.flatMap(user =>\n    pipe(getOrg(user.orgId), Effect.flatMap(org => ...))\n  )\n\n  // Good (関数抽出)\n  const fetchOrgFor = (user: User) => pipe(\n    getOrg(user.orgId),\n    Effect.flatMap(org => ...),\n  )\n  pipe(getUser(id), Effect.flatMap(fetchOrgFor))\n\n  // Good (Effect.Do + bind)\n  pipe(\n    Effect.Do,\n    Effect.bind("user", () => getUser(id)),\n    Effect.bind("org", ({ user }) => getOrg(user.orgId)),\n    Effect.map(({ user, org }) => ...),\n  )',
    },
  },
  createOnce(context) {
    return {
      CallExpression(node) {
        const ns = isFpNamespaceCall(node);
        if (!ns) return;
        if (isExcludedMethod(ns.namespace, ns.method)) return;

        for (const callback of getCallbackArgs(node)) {
          if (callback.type !== "ArrowFunctionExpression") continue;
          const body = callback.body;
          if (isStandalonePipeCall(body)) {
            context.report({
              node: body,
              messageId: "noPipeInFpCallback",
              data: { namespace: ns.namespace, method: ns.method },
            });
          }
        }
      },
    };
  },
};

export default noPipeInFpCallback;
