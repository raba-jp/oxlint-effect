export default {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Effect/Stream/pipe の結果を中間変数に格納し、1回しか使用しない場合を禁止します。複数回使用される変数は許可されます。",
    },
    messages: {
      noIntermediateVariable:
        '変数 "{{varName}}" は pipe/Effect の結果を格納していますが、1回しか使用されていません。可読性向上のため pipe() チェーンに直接インライン化してください。',
    },
    schema: [],
  },

  create(context) {
    const EFFECT_MODULES = new Set([
      "Effect",
      "Stream",
      "PubSub",
      "Queue",
      "Ref",
      "Deferred",
      "Fiber",
      "FiberRef",
      "FiberSet",
      "FiberMap",
      "Layer",
      "Pool",
      "Semaphore",
      "Schedule",
      "Scope",
      "STM",
      "TRef",
      "TQueue",
      "TPriorityQueue",
      "TSet",
      "TMap",
      "TArray",
      "TSemaphore",
      "TReentrantLock",
      "Sink",
      "Channel",
      "GroupBy",
      "KeyedPool",
      "Mailbox",
      "Metric",
      "Resource",
      "ResourcePool",
      "Runtime",
      "RcRef",
      "RcMap",
      "RcSet",
      "SubscriptionRef",
    ]);

    const EXECUTION_METHODS = new Set([
      "runSync",
      "runPromise",
      "runFork",
      "runCallback",
      "unsafeRunSync",
      "unsafeRunPromise",
      "unsafeRunCallback",
    ]);

    const FACTORY_METHODS = new Set(["decode", "encode", "decodeUnknown", "encodeUnknown"]);

    const trackedVariables = new Map();

    const isExecutionCall = (node) => {
      return (
        node.type === "CallExpression" &&
        node.callee.type === "MemberExpression" &&
        node.callee.property.type === "Identifier" &&
        EXECUTION_METHODS.has(node.callee.property.name)
      );
    };

    const isFactoryCall = (node) => {
      return (
        node.type === "CallExpression" &&
        node.callee.type === "MemberExpression" &&
        node.callee.object.type === "Identifier" &&
        node.callee.object.name === "Schema" &&
        node.callee.property.type === "Identifier" &&
        FACTORY_METHODS.has(node.callee.property.name)
      );
    };

    const isSchemaComposition = (node) => {
      if (node.type !== "CallExpression" || node.callee.type !== "Identifier" || node.callee.name !== "pipe") {
        return false;
      }

      const firstArg = node.arguments[0];
      if (!firstArg) return false;

      return (
        firstArg.type === "MemberExpression" &&
        firstArg.object.type === "Identifier" &&
        firstArg.object.name === "Schema"
      );
    };

    const isEffectModuleCall = (node) => {
      if (node.type !== "CallExpression") {
        return false;
      }

      if (isExecutionCall(node)) {
        return false;
      }

      if (isFactoryCall(node)) {
        return false;
      }

      if (isSchemaComposition(node)) {
        return false;
      }

      if (
        node.callee.type === "MemberExpression" &&
        node.callee.object.type === "Identifier" &&
        EFFECT_MODULES.has(node.callee.object.name)
      ) {
        return true;
      }

      if (node.callee.type === "Identifier" && node.callee.name === "pipe") {
        return true;
      }

      return false;
    };

    return {
      VariableDeclarator(node) {
        if (node.init && isEffectModuleCall(node.init)) {
          if (node.id.type === "Identifier") {
            trackedVariables.set(node.id.name, {
              node: node.id,
              declarator: node,
              usageCount: 0,
              usageNodes: [],
            });
          }
        }
      },

      CallExpression(node) {
        if (node.callee.type === "Identifier" && node.callee.name === "pipe") {
          const firstArg = node.arguments[0];
          if (firstArg?.type === "Identifier" && trackedVariables.has(firstArg.name)) {
            const tracked = trackedVariables.get(firstArg.name);
            tracked.usageCount++;
            tracked.usageNodes.push(firstArg);
          }
        }
      },

      MemberExpression(node) {
        if (node.object.type === "Identifier" && trackedVariables.has(node.object.name)) {
          const tracked = trackedVariables.get(node.object.name);
          tracked.usageCount++;
          tracked.usageNodes.push(node.object);
        }
      },

      Property(node) {
        if (node.value.type === "Identifier" && trackedVariables.has(node.value.name)) {
          const tracked = trackedVariables.get(node.value.name);
          tracked.usageCount++;
          tracked.usageNodes.push(node.value);
        }
      },

      "Program:exit": () => {
        for (const [varName, tracked] of trackedVariables.entries()) {
          if (tracked.usageCount === 1) {
            context.report({
              node: tracked.usageNodes[0],
              messageId: "noIntermediateVariable",
              data: {
                varName,
              },
            });
          }
        }
        trackedVariables.clear();
      },
    };
  },
};
