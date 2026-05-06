# oxlint-effect

[oxlint](https://oxc.rs/docs/guide/usage/linter) で動く [Effect](https://effect.website/) 向けの lint ルール集。

## インストール

このパッケージは npm に publish されていません。GitHub から直接インストールしてください。

```sh
bun add github:raba-jp/oxlint-effect
```

## 使い方

`.oxlintrc.json` で `plugins` にパッケージ名を、`rules` のキー prefix に `effect/` を指定します。

```jsonc
{
  "plugins": ["oxlint-effect"],
  "rules": {
    "effect/no-effect-gen": "error",
    "effect/prefer-andThen": "warn"
  }
}
```

## ルール一覧 (26)

- `effect/no-block-in-fp-callback`
- `effect/no-call-wrapping-pipe`
- `effect/no-direct-tag-access`
- `effect/no-effect-gen`
- `effect/no-effect-if-option-check`
- `effect/no-intermediate-effect-variables`
- `effect/no-method-pipe`
- `effect/no-nested-pipe`
- `effect/no-nested-pipes`
- `effect/no-pipe-in-fp-callback`
- `effect/no-switch-statement`
- `effect/no-unnecessary-pipe-wrapper`
- `effect/prefer-andThen`
- `effect/prefer-as-void`
- `effect/prefer-as`
- `effect/prefer-effect-if-over-match-boolean`
- `effect/prefer-effect-platform`
- `effect/prefer-filter-or-fail`
- `effect/prefer-flatten`
- `effect/prefer-from-nullable`
- `effect/prefer-get-or-else`
- `effect/prefer-get-or-null`
- `effect/prefer-get-or-undefined`
- `effect/prefer-match-over-conditionals`
- `effect/prefer-match-over-ternary`
- `effect/prefer-match-tag`

## 開発

```sh
bun install
bun test
```

## ライセンス

MIT
