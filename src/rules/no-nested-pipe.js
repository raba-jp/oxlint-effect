/** @type {import("@oxlint/plugins").CreateOnceRule} */
const noNestedPipe = {
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "pipe") {
          let parent = node.parent;
          while (parent) {
            if (
              parent.type === "CallExpression" &&
              parent.callee.type === "Identifier" &&
              parent.callee.name === "pipe"
            ) {
              context.report({
                node,
                messageId: "noNestedPipe",
              });
              break;
            }
            parent = parent.parent;
          }
        }
      },
    };
  },
  meta: {
    type: "suggestion",
    messages: {
      noNestedPipe:
        "ネストした pipe() は禁止されています。内側の pipe を Effect を返す名前付き関数に抽出してください。",
    },
  },
};

export default noNestedPipe;
