/** @type {import("@oxlint/plugins").CreateOnceRule} */
const noCallWrappingPipe = {
  createOnce(context) {
    return {
      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "pipe") return;

        if (node.arguments.length !== 1) return;
        const arg = node.arguments[0];
        if (arg.type !== "CallExpression") return;
        if (arg.callee.type !== "Identifier" || arg.callee.name !== "pipe") return;

        const sourceCode = context.sourceCode ?? context.getSourceCode?.();
        const isFixable = !node.typeArguments && !arg.typeArguments && arg.arguments.length > 0 && sourceCode;

        context.report({
          node,
          messageId: "callWrappingPipe",
          ...(isFixable && {
            fix(fixer) {
              const calleeText = sourceCode.getText(node.callee);
              const pipeArgsText = arg.arguments.map((a) => sourceCode.getText(a)).join(", ");
              return fixer.replaceText(node, `pipe(${pipeArgsText}, ${calleeText})`);
            },
          }),
        });
      },
    };
  },
  meta: {
    type: "suggestion",
    fixable: "code",
    messages: {
      callWrappingPipe:
        "f(pipe(...)) のように pipe を関数呼び出しでラップしないでください。pipe(..., f) と書くことでネストを浅くできます。",
    },
  },
};

export default noCallWrappingPipe;
