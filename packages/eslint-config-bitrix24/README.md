# @bitrix24/eslint-config-bitrix24

Shareable ESLint config for the Bitrix24 JavaScript style guide.

Requires ESLint 9 (flat config). For ESLint 8, use v1.x of this package.

## Installation

```bash
npm install --save-dev eslint @bitrix24/eslint-config-bitrix24
```

## Usage

### Preset (recommended)

The default export includes everything: rules, Flow and TypeScript parsers, legacy script overrides, tooling and testing configs.

```js
import bitrix24 from '@bitrix24/eslint-config-bitrix24';

export default [
    { ignores: ['**/dist/', '**/*.bundle.js'] },
    ...bitrix24,
];
```

### Granular exports

All subpath exports are without `files` — you control which files they apply to.

```js
import bitrix24Rules from '@bitrix24/eslint-config-bitrix24/rules';
import bitrix24Flow from '@bitrix24/eslint-config-bitrix24/flow';
import bitrix24TypeScript from '@bitrix24/eslint-config-bitrix24/typescript';
import bitrix24LegacyScripts from '@bitrix24/eslint-config-bitrix24/legacy-scripts';
import bitrix24Tooling from '@bitrix24/eslint-config-bitrix24/tooling';
import bitrix24Testing from '@bitrix24/eslint-config-bitrix24/testing';

export default [
    ...bitrix24Rules,
    { files: ['**/*.js'], ...bitrix24Flow },
    { files: ['**/*.ts'], ...bitrix24TypeScript },
    { files: ['**/*.js'], ignores: ['**/src/**'], ...bitrix24LegacyScripts },
    { files: ['**/bundle.config.{js,ts}'], ...bitrix24Tooling },
    { files: ['**/test/**/*.{js,ts}'], ...bitrix24Testing },
];
```

### Without Flow (pure JS + TS)

If your project doesn't use Flow, skip `./flow` and `./legacy-scripts`:

```js
import bitrix24Rules from '@bitrix24/eslint-config-bitrix24/rules';
import bitrix24TypeScript from '@bitrix24/eslint-config-bitrix24/typescript';
import bitrix24Tooling from '@bitrix24/eslint-config-bitrix24/tooling';
import bitrix24Testing from '@bitrix24/eslint-config-bitrix24/testing';

export default [
    ...bitrix24Rules,
    { files: ['**/*.ts'], ...bitrix24TypeScript },
    { files: ['**/bundle.config.{js,ts}'], ...bitrix24Tooling },
    { files: ['**/test/**/*.{js,ts}'], ...bitrix24Testing },
];
```

## Exports

| Export | Type | Description |
|---|---|---|
| `.` | array (preset) | Rules + Flow + TypeScript + legacy scripts + tooling + testing |
| `./rules` | array | Rules, plugins, language settings (browser, ES2021, BX global) |
| `./flow` | object | Babel parser with Flow syntax support |
| `./typescript` | object | TypeScript parser, disables TS-redundant ESLint rules |
| `./legacy-scripts` | object | `sourceType: script`, disables `no-bx` and `no-io-without-polyfill` |
| `./tooling` | object | Node.js globals, disables `need-alias` and `no-default-export` |
| `./testing` | object | Mocha/Chai globals, disables `max-lines-per-function` and `cognitive-complexity` |

The preset (`.`) applies default `files` patterns. All subpath exports have no `files` — you specify them yourself.

## What's included

- ESLint core (errors, best practices, ES6, variables, style)
- [eslint-plugin-import](https://github.com/import-js/eslint-plugin-import)
- [eslint-plugin-promise](https://github.com/eslint-community/eslint-plugin-promise)
- [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn)
- [eslint-plugin-sonarjs](https://github.com/SonarSource/eslint-plugin-sonarjs)
- [eslint-plugin-vue](https://github.com/vuejs/eslint-plugin-vue) (script rules enabled, SFC rules off by default)
- [@bitrix24/eslint-plugin-bitrix24-rules](https://github.com/bitrix24/eslint-bitrix24/tree/main/packages/eslint-plugin-bitrix24-rules)

## License

MIT
