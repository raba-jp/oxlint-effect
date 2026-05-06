/**
 * Effect / Stream / Option / Either / Match の `<Namespace>.<method>(...)` 形式の呼び出しと、
 * 引数中の callback (ArrowFunctionExpression / FunctionExpression) を扱う共有ヘルパー。
 *
 * @see .claude/rules/typescript.md
 */

export const FP_NAMESPACES = ["Effect", "Stream", "Option", "Either", "Match"];

/**
 * BlockStatement / pipe ネスト検査の対象外とする method 群。
 * generator function や callback-style API、release ハンドラなど BlockStatement / pipe が
 * 正当に使われる API を除外する。
 */
export const EXCLUDED_METHODS = {
  Effect: new Set(["gen", "fn", "fnUntraced", "acquireRelease", "acquireUseRelease", "async", "asyncEffect"]),
  Stream: new Set(["async", "asyncEffect", "asyncPush", "asyncScoped"]),
  Option: new Set([]),
  Either: new Set([]),
  Match: new Set([]),
};

/** `<Namespace>.<method>(...)` 形式の CallExpression かを判定し、namespace と method を返す。 */
export function isFpNamespaceCall(node) {
  if (node?.type !== "CallExpression") return null;
  const callee = node.callee;
  if (callee?.type !== "MemberExpression") return null;
  if (callee.computed) return null;
  if (callee.object?.type !== "Identifier") return null;
  if (callee.property?.type !== "Identifier") return null;

  const namespace = callee.object.name;
  if (!FP_NAMESPACES.includes(namespace)) return null;

  return { namespace, method: callee.property.name };
}

/** CallExpression の引数のうち、ArrowFunctionExpression / FunctionExpression を抽出する。 */
export function getCallbackArgs(node) {
  if (node?.type !== "CallExpression" || !globalThis.Array.isArray(node.arguments)) return [];
  return node.arguments.filter((arg) => arg?.type === "ArrowFunctionExpression" || arg?.type === "FunctionExpression");
}

/** namespace + method の組み合わせが除外対象かを判定する。 */
export function isExcludedMethod(namespace, method) {
  return EXCLUDED_METHODS[namespace]?.has(method) ?? false;
}
