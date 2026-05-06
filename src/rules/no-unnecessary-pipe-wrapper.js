/** @type {import("@oxlint/plugins").CreateOnceRule} */
const noUnnecessaryPipeWrapper = {
  createOnce(context) {
    const checkPipeWrapper = (node, params) => {
      if (
        node.callee.type === "Identifier" &&
        node.callee.name === "pipe" &&
        node.arguments.length === 2 &&
        node.arguments[0].type === "Identifier" &&
        params.length === 1 &&
        params[0].type === "Identifier" &&
        params[0].name === node.arguments[0].name
      ) {
        context.report({
          node,
          messageId: "unnecessaryWrapper",
        });
      }
    };

    return {
      // (param) => pipe(param, fn)
      "ArrowFunctionExpression > CallExpression.body"(node) {
        checkPipeWrapper(node, node.parent.params);
      },
      // function foo(param) { return pipe(param, fn); }
      "FunctionDeclaration > BlockStatement > ReturnStatement > CallExpression.argument"(node) {
        checkPipeWrapper(node, node.parent.parent.parent.params);
      },
      // const foo = function(param) { return pipe(param, fn); }
      "FunctionExpression > BlockStatement > ReturnStatement > CallExpression.argument"(node) {
        checkPipeWrapper(node, node.parent.parent.parent.params);
      },
    };
  },
  meta: {
    type: "suggestion",
    messages: {
      unnecessaryWrapper: "不要な関数ラッパーです。(x) => pipe(x, fn) は冗長です。fn を直接使用してください。",
    },
  },
};

export default noUnnecessaryPipeWrapper;
