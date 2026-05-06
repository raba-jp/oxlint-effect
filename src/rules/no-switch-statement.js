/** @type {import("@oxlint/plugins").CreateOnceRule} */
const noSwitchStatement = {
  createOnce(context) {
    return {
      SwitchStatement(node) {
        context.report({
          node,
          messageId: "noSwitchStatement",
        });
      },
    };
  },
  meta: {
    type: "suggestion",
    messages: {
      noSwitchStatement:
        "switch 文は関数型コードでは禁止されています。Match.value によるパターンマッチング、Match.type/Match.tag による型安全な網羅的マッチング、または Either.match, Option.match, Exit.match を使用してください。",
    },
  },
};

export default noSwitchStatement;
