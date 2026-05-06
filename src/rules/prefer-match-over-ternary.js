/** @type {import("@oxlint/plugins").CreateOnceRule} */
const preferMatchOverTernary = {
  createOnce(context) {
    const isEffectCall = (node) => {
      if (!node || node.type !== "CallExpression") {
        return false;
      }

      if (
        node.callee.type === "MemberExpression" &&
        node.callee.object.type === "Identifier" &&
        node.callee.object.name === "Effect"
      ) {
        return true;
      }

      if (
        node.callee.type === "Identifier" &&
        (node.callee.name.startsWith("Effect") || node.callee.name.endsWith("Effect"))
      ) {
        return true;
      }

      return false;
    };

    const isCallExpression = (node) => {
      return node && node.type === "CallExpression";
    };

    const isSimpleLiteralEquality = (condition) => {
      if (condition.type !== "BinaryExpression") {
        return false;
      }

      if (condition.operator !== "===" && condition.operator !== "==") {
        return false;
      }

      const { left, right } = condition;

      const hasIdentifier =
        (left.type === "Identifier" && right.type === "Literal") ||
        (right.type === "Identifier" && left.type === "Literal");

      const hasMemberAccess =
        (left.type === "MemberExpression" &&
          !left.computed &&
          right.type === "Literal" &&
          typeof right.value === "string") ||
        (right.type === "MemberExpression" &&
          !right.computed &&
          left.type === "Literal" &&
          typeof left.value === "string");

      return hasIdentifier || hasMemberAccess;
    };

    const isBooleanCondition = (condition) => {
      if (
        condition.type === "Identifier" ||
        condition.type === "UnaryExpression" ||
        condition.type === "CallExpression"
      ) {
        return true;
      }

      if (condition.type === "BinaryExpression") {
        const booleanOperators = ["===", "!==", "==", "!=", "<", ">", "<=", ">="];
        return booleanOperators.includes(condition.operator);
      }

      if (condition.type === "LogicalExpression") {
        return true;
      }

      return false;
    };

    const isRelevantTernary = (node) => {
      if (node.type !== "ConditionalExpression") {
        return false;
      }

      const consequentIsCall = isCallExpression(node.consequent);
      const alternateIsCall = isCallExpression(node.alternate);

      if (!consequentIsCall && !alternateIsCall) {
        return false;
      }

      const consequentIsEffect = isEffectCall(node.consequent);
      const alternateIsEffect = isEffectCall(node.alternate);

      if (consequentIsEffect || alternateIsEffect) {
        return true;
      }

      if (consequentIsCall && alternateIsCall) {
        return true;
      }

      return false;
    };

    const isEffectConstructor = (node) => {
      if (!node || node.type !== "CallExpression") {
        return false;
      }

      if (
        node.callee.type === "MemberExpression" &&
        node.callee.object.type === "Identifier" &&
        node.callee.object.name === "Effect" &&
        node.callee.property.type === "Identifier"
      ) {
        const methodName = node.callee.property.name;
        return methodName === "succeed" || methodName === "fail" || methodName === "sync" || methodName === "promise";
      }

      return false;
    };

    const isInReturnOrAssignment = (node) => {
      if (!node.parent) {
        return false;
      }

      if (node.parent.type === "ReturnStatement") {
        return true;
      }

      if (node.parent.type === "VariableDeclarator" || node.parent.type === "AssignmentExpression") {
        return true;
      }

      if (node.parent.type === "ArrowFunctionExpression" && node.parent.body === node) {
        return true;
      }

      if (node.parent.type === "CallExpression" && isEffectConstructor(node.parent)) {
        return true;
      }

      return false;
    };

    return {
      ConditionalExpression(node) {
        const inEffectConstructor =
          node.parent && node.parent.type === "CallExpression" && isEffectConstructor(node.parent);

        if (inEffectConstructor) {
          if (isSimpleLiteralEquality(node.test)) {
            return;
          }

          context.report({
            node,
            messageId: "useMatchInEffectConstructor",
          });
          return;
        }

        if (!isRelevantTernary(node)) {
          return;
        }

        if (!isInReturnOrAssignment(node)) {
          return;
        }

        if (isSimpleLiteralEquality(node.test)) {
          return;
        }

        const consequentIsEffect = isEffectCall(node.consequent);
        const alternateIsEffect = isEffectCall(node.alternate);
        if ((consequentIsEffect || alternateIsEffect) && isBooleanCondition(node.test)) {
          context.report({
            node,
            messageId: "useEffectIf",
          });
          return;
        }

        context.report({
          node,
          messageId: "useMatchInstead",
        });
      },
    };
  },
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Prefer Match.value over ternary operators for conditional Effect/function selection. Ternary operators are imperative and less composable than Match patterns.",
    },
    messages: {
      useMatchInstead:
        "三項演算子の代わりに Match.value を使用してください。パターン: pipe(Match.value(condition), Match.when(...), Match.exhaustive)",
      useMatchInEffectConstructor:
        "Match.value で値を選択してから Effect コンストラクタでラップしてください。各ブランチで Effect.succeed/fail を重複させないこと。",
      useEffectIf:
        "boolean 条件の分岐には三項演算子を使用してください。パターン: condition ? effectIfTrue : effectIfFalse",
    },
  },
};

export default preferMatchOverTernary;
