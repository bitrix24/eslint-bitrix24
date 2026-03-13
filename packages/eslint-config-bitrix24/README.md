# @bitrix24/eslint-config-bitrix24

Shareable ESLint config for the Bitrix24 JavaScript style guide.

Supports ESLint 8 (legacy) and ESLint 9 (flat config).

## Installation

```bash
npm install --save-dev eslint @bitrix24/eslint-config-bitrix24
```

## Usage

### ESLint 9 (Flat Config)

`eslint.config.js`:

```js
import bitrix24Config from '@bitrix24/eslint-config-bitrix24/flat';

export default [
    ...bitrix24Config,
];
```

### ESLint 8 (Legacy)

`.eslintrc.json`:

```json
{
    "extends": ["@bitrix24/eslint-config-bitrix24"]
}
```

## What's Included

This config includes rules from:

- ESLint core (errors, best practices, ES6, variables, style)
- [eslint-plugin-import](https://github.com/import-js/eslint-plugin-import)
- [eslint-plugin-promise](https://github.com/eslint-community/eslint-plugin-promise)
- [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn)
- [eslint-plugin-sonarjs](https://github.com/SonarSource/eslint-plugin-sonarjs)
- [eslint-plugin-vue](https://github.com/vuejs/eslint-plugin-vue)
- [@bitrix24/eslint-plugin-bitrix24-rules](https://github.com/bitrix24/eslint-bitrix24/tree/main/packages/eslint-plugin-bitrix24-rules)

Parser: [@babel/eslint-parser](https://github.com/babel/babel/tree/main/eslint/babel-eslint-parser) with Flow syntax support.

## License

MIT
