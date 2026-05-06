import { isVoidReturn } from "./utils.js";

const SUPPORTED_TYPES = ["Effect", "Option", "Stream", "Schedule", "Channel", "STM", "Sink", "Cause"];

/** @type {import("@oxlint/plugins").CreateRule} */
const preferAs = {
  create(context) {
    const sourceCode = context.sourceCode;

    const isMapCall = (node) => {
      return (
        node.callee.type === "MemberExpression" &&
        node.callee.property.type === "Identifier" &&
        node.callee.property.name === "map" &&
        node.callee.object.type === "Identifier" &&
        SUPPORTED_TYPES.includes(node.callee.object.name)
      );
    };

    const isConstantReturn = (arrowFunc) => {
      if (arrowFunc.params.length !== 0) {
        return false;
      }

      const body = arrowFunc.body;

      if (body.type === "UnaryExpression" && body.operator === "void") {
        return false;
      }
      if (body.type === "Identifier" && body.name === "undefined") {
        return false;
      }
      if (body.type === "BlockStatement") {
        return false;
      }

      return true;
    };

    return {
      CallExpression(node) {
        if (!isMapCall(node)) return;

        const mapArg = node.arguments[0];
        if (!mapArg || mapArg.type !== "ArrowFunctionExpression") {
          return;
        }

        if (!isConstantReturn(mapArg)) return;
        if (isVoidReturn(mapArg)) return;

        const effectType = node.callee.object.name;
        const valueText = sourceCode.getText(mapArg.body);

        context.report({
          node,
          messageId: "preferAs",
          data: { effectType, value: valueText },
        });
      },
    };
  },
  meta: {
    type: "suggestion",
    messages: {
      preferAs:
        "{{effectType}}.map(() => {{value}}) の代わりに {{effectType}}.as({{value}}) を使用してください。より簡潔で意図が明確になります。",
    },
  },
};

export default preferAs;
