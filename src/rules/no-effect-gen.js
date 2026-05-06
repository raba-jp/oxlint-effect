const isContextServiceCallee = (callee) => {
  if (!callee) return false;

  const target = callee.type === "TSInstantiationExpression" ? callee.expression : callee;

  return (
    target.type === "MemberExpression" &&
    target.object.type === "Identifier" &&
    (target.object.name === "Context" || target.object.name === "Effect") &&
    target.property.type === "Identifier" &&
    target.property.name === "Service"
  );
};

const isAllowedServicePropertyValue = (node) => {
  const property = node.parent;
  if (
    !property ||
    property.type !== "Property" ||
    property.value !== node ||
    property.key.type !== "Identifier" ||
    (property.key.name !== "make" && property.key.name !== "effect" && property.key.name !== "scoped")
  ) {
    return false;
  }

  const objectExpression = property.parent;
  if (!objectExpression || objectExpression.type !== "ObjectExpression") return false;

  const outerCall = objectExpression.parent;
  if (!outerCall || outerCall.type !== "CallExpression" || !outerCall.arguments.includes(objectExpression)) {
    return false;
  }

  const innerCall = outerCall.callee;
  if (!innerCall || innerCall.type !== "CallExpression") return false;

  return isContextServiceCallee(innerCall.callee);
};

const isAllowedLayerArgument = (node) => {
  const callExpression = node.parent;
  if (
    !callExpression ||
    callExpression.type !== "CallExpression" ||
    callExpression.arguments.length < 2 ||
    callExpression.arguments[1] !== node
  ) {
    return false;
  }

  const callee = callExpression.callee;
  return (
    callee.type === "MemberExpression" &&
    callee.object.type === "Identifier" &&
    callee.object.name === "Layer" &&
    callee.property.type === "Identifier" &&
    (callee.property.name === "effect" || callee.property.name === "scoped")
  );
};

const TEST_RUNNER_NAMES = new Set(["effect", "live", "scoped", "scopedLive", "layer"]);
const TEST_MODIFIER_NAMES = new Set(["skip", "only", "fails", "skipIf", "runIf", "each"]);

const resolveTestRunnerName = (callee) => {
  if (!callee) return null;

  if (callee.type === "CallExpression") {
    return resolveTestRunnerName(callee.callee);
  }

  if (callee.type === "MemberExpression" && callee.property.type === "Identifier") {
    if (TEST_MODIFIER_NAMES.has(callee.property.name)) {
      return resolveTestRunnerName(callee.object);
    }
    if (TEST_RUNNER_NAMES.has(callee.property.name)) {
      return callee.property.name;
    }
    return null;
  }

  if (callee.type === "Identifier" && TEST_RUNNER_NAMES.has(callee.name)) {
    return callee.name;
  }

  return null;
};

const findEnclosingArrowAsBody = (node) => {
  const parent = node.parent;
  if (!parent) return null;

  if (parent.type === "ArrowFunctionExpression" && parent.body === node) {
    return parent;
  }

  if (parent.type === "ReturnStatement" && parent.argument === node) {
    const block = parent.parent;
    if (block && block.type === "BlockStatement" && block.body.length === 1 && block.body[0] === parent) {
      const fn = block.parent;
      if (fn && fn.type === "ArrowFunctionExpression" && fn.body === block) {
        return fn;
      }
    }
  }

  return null;
};

const isAllowedTestCallback = (node) => {
  const arrow = findEnclosingArrowAsBody(node);
  if (!arrow) return false;

  const call = arrow.parent;
  if (!call || call.type !== "CallExpression" || !call.arguments.includes(arrow)) return false;

  return resolveTestRunnerName(call.callee) !== null;
};

/** @type {import("@oxlint/plugins").CreateOnceRule} */
const noEffectGen = {
  createOnce(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === "MemberExpression" &&
          node.callee.object.type === "Identifier" &&
          node.callee.object.name === "Effect" &&
          node.callee.property.type === "Identifier" &&
          node.callee.property.name === "gen" &&
          !isAllowedServicePropertyValue(node) &&
          !isAllowedLayerArgument(node) &&
          !isAllowedTestCallback(node)
        ) {
          context.report({
            node,
            messageId: "noEffectGen",
          });
        }
      },
    };
  },
  meta: {
    type: "suggestion",
    messages: {
      noEffectGen:
        "Effect.gen の使用は禁止されています。Effect.Do + pipe、Effect.all、Effect.andThen 等のコンビネータで合成してください。Context.Service の make/effect/scoped プロパティ、Layer.effect / Layer.scoped の第 2 引数、または @effect/vitest の it.effect / it.layer 等のテスト関数の直接の callback としてのみ許可されます。",
    },
  },
};

export default noEffectGen;
