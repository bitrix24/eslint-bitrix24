# @bitrix24/eslint-plugin-bitrix24-rules

Custom ESLint rules for the Bitrix24 JavaScript style guide.

Compatible with ESLint 8, ESLint 9 and oxlint (JS plugins).

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

### `need-alias` settings

The rule reads `allowedModules` from `webpack.aliases.js`. The file is looked up in this order:

1. `settings.bitrix24.aliasesFile` - an explicit path;
2. the nearest `webpack.aliases.js` above the linted file;
3. `webpack.aliases.js` in the repository the plugin is installed into.

The file is re-read only when it changes.

## License

MIT
