import { parseSync, visitorKeys } from "oxc-parser";

const setParents = (node, parent) => {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const child of node) setParents(child, parent);
    return;
  }
  if (typeof node.type !== "string") return;

  Object.defineProperty(node, "parent", {
    value: parent,
    writable: true,
    configurable: true,
    enumerable: false,
  });

  const keys = visitorKeys[node.type] ?? Object.keys(node);
  for (const key of keys) {
    const child = node[key];
    if (child) setParents(child, node);
  }
};

const parseSelector = (raw) => {
  const isExit = raw.endsWith(":exit");
  const head = isExit ? raw.slice(0, -":exit".length) : raw;
  const parts = head.split(/\s*>\s*/).map((s) => s.trim());
  const last = parts[parts.length - 1];
  const [matchType, fieldName] = last.includes(".") ? last.split(".") : [last, null];
  const ancestors = parts
    .slice(0, -1)
    .map((p) => p.split(".")[0])
    .reverse();
  return { selector: raw, isExit, matchType, fieldName, ancestors };
};

const matchesSelector = (parsed, node) => {
  if (node.type !== parsed.matchType) return false;
  let current = node;
  if (parsed.fieldName) {
    const parent = current.parent;
    if (!parent || parent[parsed.fieldName] !== current) return false;
  }
  let parent = current.parent;
  for (const ancestorType of parsed.ancestors) {
    if (!parent || parent.type !== ancestorType) return false;
    current = parent;
    parent = current.parent;
  }
  return true;
};

const isPlainTypeKey = (key) => /^[A-Z][A-Za-z0-9$_]*$/.test(key);

const buildSourceCode = (source, parseResult) => {
  const comments = parseResult.comments ?? [];

  const getText = (node, beforeCount = 0, afterCount = 0) => {
    if (!node) return source;
    const start = Math.max(0, (node.start ?? 0) - beforeCount);
    const end = Math.min(source.length, (node.end ?? source.length) + afterCount);
    return source.slice(start, end);
  };

  const getCommentsInside = (node) => {
    if (!node) return [];
    return comments.filter((c) => c.start >= node.start && c.end <= node.end);
  };

  const emptyScope = {
    variables: [],
    references: [],
    childScopes: [],
    upper: null,
    type: "global",
    block: parseResult.program,
  };

  return {
    text: source,
    getText,
    getCommentsInside,
    // 型注釈ベースの解析が必要なルール用のスタブ。テスト側で必要なら独自に provide する。
    getScope: () => emptyScope,
    // トークンレベル API は fixer が触ろうとした際に null を返してフォールバックさせる。
    getFirstTokenBetween: () => null,
    getTokenAfter: () => null,
    getFirstToken: () => null,
    getLastToken: () => null,
  };
};

export const runRule = (rule, source, { lang = "ts", scopeOverrides } = {}) => {
  const result = parseSync(`fixture.${lang}`, source, { lang });
  if (result.errors.length > 0) {
    throw new Error(`Parse errors: ${result.errors.map((e) => e.message).join(", ")}`);
  }

  setParents(result.program, null);

  const reports = [];
  const sourceCode = buildSourceCode(source, result);

  if (scopeOverrides) {
    sourceCode.getScope = (node) => scopeOverrides(node) ?? { variables: [], upper: null };
  }

  const context = {
    sourceCode,
    getSourceCode: () => sourceCode,
    report: (descriptor) => {
      let fixes = null;
      if (typeof descriptor.fix === "function") {
        // fixer は noop だが、fixer 関数自体を呼んでクラッシュしないことを軽く担保する。
        const fakeFixer = {
          replaceText: () => null,
          remove: () => null,
          removeRange: () => null,
          insertTextAfter: () => null,
          insertTextBefore: () => null,
          insertTextAfterRange: () => null,
          insertTextBeforeRange: () => null,
          replaceTextRange: () => null,
        };
        try {
          fixes = descriptor.fix(fakeFixer);
        } catch {
          fixes = null;
        }
      }
      reports.push({
        nodeType: descriptor.node.type,
        nodeStart: descriptor.node.start,
        nodeEnd: descriptor.node.end,
        messageId: descriptor.messageId,
        data: descriptor.data,
        fix: fixes,
      });
    },
  };

  const factory = rule.createOnce ?? rule.create;
  const visitor = factory(context);

  const enterByType = new Map();
  const exitByType = new Map();
  const selectorEnter = [];
  const selectorExit = [];

  for (const [key, handler] of Object.entries(visitor)) {
    if (typeof handler !== "function") continue;
    const isExit = key.endsWith(":exit");
    const head = isExit ? key.slice(0, -":exit".length) : key;
    const isSimple = isPlainTypeKey(head);

    if (isSimple) {
      const target = isExit ? exitByType : enterByType;
      const list = target.get(head) ?? [];
      list.push(handler);
      target.set(head, list);
    } else {
      const parsed = parseSelector(key);
      (isExit ? selectorExit : selectorEnter).push({ parsed, handler });
    }
  }

  const visit = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const c of node) visit(c);
      return;
    }
    if (typeof node.type !== "string") return;

    const enters = enterByType.get(node.type);
    if (enters) for (const h of enters) h(node);
    for (const { parsed, handler } of selectorEnter) {
      if (matchesSelector(parsed, node)) handler(node);
    }

    const keys = visitorKeys[node.type] ?? [];
    for (const key of keys) {
      const child = node[key];
      if (child) visit(child);
    }

    const exits = exitByType.get(node.type);
    if (exits) for (const h of exits) h(node);
    for (const { parsed, handler } of selectorExit) {
      if (matchesSelector(parsed, node)) handler(node);
    }
  };

  visit(result.program);

  return reports;
};
