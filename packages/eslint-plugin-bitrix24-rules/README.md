# @bitrix24/eslint-plugin-bitrix24-rules

Custom ESLint rules for the Bitrix24 JavaScript style guide.

Compatible with ESLint 8 and ESLint 9.

## Installation

```bash
npm install --save-dev @bitrix24/eslint-plugin-bitrix24-rules
```

This plugin is included automatically when using [@bitrix24/eslint-config-bitrix24](https://github.com/bitrix24/eslint-bitrix24/tree/main/packages/eslint-config-bitrix24). Manual installation is only needed if you want to use the rules independently.

## Rules

| Rule | Description |
|------|-------------|
| `brace-on-same-line` | Enforce brace placement per construct type (Allman, 1TBS, or per-node) |
| `need-alias` | Require Bitrix extension aliases for imports |
| `no-bx` | Disallow direct usage of the `BX` global |
| `no-bx-message` | Disallow `BX.message()` |
| `no-classlist` | Disallow direct `classList` manipulation |
| `no-eventemitter-without-namespace` | Require namespace for event emitter subscriptions |
| `no-io-without-polyfill` | Disallow IO operations without polyfill |
| `no-jsdd` | Disallow `jsDD` usage |
| `no-native-dialogs` | Disallow native browser dialogs (`alert`, `confirm`, `prompt`) |
| `no-native-dom-methods` | Disallow native DOM manipulation methods |
| `no-native-events-binding` | Disallow native event binding |
| `no-nil-compare` | Disallow loose comparison with `null`/`undefined` |
| `no-private` | Disallow private class fields |
| `no-pseudo-private` | Disallow underscore-prefixed pseudo-private properties |
| `no-short-class-property` | Disallow short class property syntax |
| `no-style` | Disallow direct `style` property manipulation |
| `no-typeof` | Disallow `typeof` checks |
| `prefer-inline-type-imports` | Prefer inline `type` keyword in imports |
| `sort-imports` | Enforce Bitrix24 import ordering convention |

## License

MIT
