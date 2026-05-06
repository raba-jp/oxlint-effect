/** @type {import("@oxlint/plugins").CreateRule} */
const preferEffectIfOverMatchBoolean = {
  create(context) {
    const sourceCode = context.sourceCode;

    const isMatchValueIdentifier = (node) => {
      return (
        node &&
        node.type === "MemberExpression" &&
        node.object.type === "Identifier" &&
        node.object.name === "Match" &&
        node.property.type === "Identifier" &&
        node.property.name === "value"
      );
    };

    const hasExplicitBooleanType = (identifier) => {
      const scope = sourceCode.getScope(identifier);
      let currentScope = scope;

      while (currentScope) {
        const variable = currentScope.variables.find((v) => v.name === identifier.name);

        if (variable && variable.defs.length > 0) {
          const def = variable.defs[0];

          if (def.type === "Parameter" && def.node.typeAnnotation) {
            const typeAnnotation = def.node.typeAnnotation.typeAnnotation;
            if (typeAnnotation && typeAnnotation.type === "TSBooleanKeyword") {
              return true;
            }
          }

          if (def.type === "Variable" && def.node.typeAnnotation) {
            const typeAnnotation = def.node.typeAnnotation.typeAnnotation;
            if (typeAnnotation && typeAnnotation.type === "TSBooleanKeyword") {
              return true;
            }
          }

          return false;
        }

        currentScope = currentScope.upper;
      }

      return false;
    };

    const isBooleanExpression = (node) => {
      if (!node) return false;

      if (node.type === "Identifier" && hasExplicitBooleanType(node)) {
        return true;
      }

      if (node.type === "BinaryExpression") {
        const booleanOps = ["===", "!==", "==", "!=", "<", ">", "<=", ">="];
        return booleanOps.includes(node.operator);
      }

      if (node.type === "LogicalExpression") {
        return true;
      }

      if (node.type === "UnaryExpression" && node.operator === "!") {
        return true;
      }

      return false;
    };

    const isPipeCall = (node) => {
      return node && node.type === "CallExpression" && node.callee.type === "Identifier" && node.callee.name === "pipe";
    };

    const isMatchValueCall = (node) => {
      return (
        node &&
        node.type === "CallExpression" &&
        node.callee.type === "MemberExpression" &&
        node.callee.object.type === "Identifier" &&
        node.callee.object.name === "Match" &&
        node.callee.property.type === "Identifier" &&
        node.callee.property.name === "value"
      );
    };

    return {
      CallExpression(node) {
        // pipe(booleanExpression, Match.value, ...)
        if (isPipeCall(node) && node.arguments.length >= 2) {
          const firstArg = node.arguments[0];
          const secondArg = node.arguments[1];

          if (isBooleanExpression(firstArg) && isMatchValueIdentifier(secondArg)) {
            context.report({
              node: secondArg,
              messageId: "useEffectIf",
            });
          }
        }

        // Match.value(booleanExpression)
        if (isMatchValueCall(node) && node.arguments.length >= 1) {
          const firstArg = node.arguments[0];

          if (isBooleanExpression(firstArg)) {
            context.report({
              node,
              messageId: "useEffectIf",
            });
          }
        }
      },
    };
  },
  meta: {
    type: "suggestion",
    messages: {
      useEffectIf:
        "boolean を Match.value にパイプする代わりに三項演算子を使用してください。パターン: condition ? effectTrue : effectFalse。Match.value は複数の値に対するパターンマッチングに使用してください。",
    },
  },
};

export default preferEffectIfOverMatchBoolean;
