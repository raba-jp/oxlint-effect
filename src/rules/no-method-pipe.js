/** @type {import("@oxlint/plugins").CreateOnceRule} */
const noMethodPipe = {
  createOnce(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "pipe"
        ) {
          context.report({
            node,
            messageId: "noMethodPipe",
          });
        }
      },
    };
  },
  meta: {
    type: "suggestion",
    messages: {
      noMethodPipe:
        "メソッドチェーンの .pipe() は禁止されています。一貫性のため、スタンドアロンの pipe() 関数を使用してください。",
    },
  },
};

export default noMethodPipe;
