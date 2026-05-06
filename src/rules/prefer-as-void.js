import { isVoidReturn } from "./utils.js";

/** @type {import("@oxlint/plugins").CreateOnceRule} */
const preferAsVoid = {
  createOnce(context) {
    const getVoidReturnValue = (arrowFunc) => {
      const body = arrowFunc.body;
      if (!body) return false;

      if (
        body.type === "UnaryExpression" &&
        body.operator === "void" &&
        body.argument.type === "Literal" &&
        body.argument.value === 0
      ) {
        return "void 0";
      }

      if (body.type === "Identifier" && body.name === "undefined") {
        return "undefined";
      }

      if (body.type === "BlockStatement" && body.body.length === 0) {
        return "{}";
      }

      return false;
    };

    const isEffectMapCall = (node) => {
      return (
        node.callee.type === "MemberExpression" &&
        node.callee.property.type === "Identifier" &&
        node.callee.property.name === "map" &&
        node.callee.object.type === "Identifier" &&
        (node.callee.object.name === "Effect" ||
          node.callee.object.name === "Option" ||
          node.callee.object.name === "Stream")
      );
    };

    return {
      CallExpression(node) {
        if (!isEffectMapCall(node)) return;

        const mapArg = node.arguments[0];
        if (!mapArg || mapArg.type !== "ArrowFunctionExpression" || mapArg.params.length !== 0) {
          return;
        }

        if (!isVoidReturn(mapArg)) return;

        const returnValue = getVoidReturnValue(mapArg);
        const effectType = node.callee.object.name;

        context.report({
          node,
          messageId: "preferAsVoid",
          data: { returnValue, effectType },
        });
      },
    };
  },
  meta: {
    type: "suggestion",
    messages: {
      preferAsVoid:
        "結果を破棄する場合は {{effectType}}.asVoid を使用してください。{{effectType}}.map(() => {{returnValue}}) は {{effectType}}.asVoid に置き換えられます。",
    },
  },
};

export default preferAsVoid;
