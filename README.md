# eslint-bitrix24

ESLint shareable configs and plugins for the Bitrix24 JavaScript style guide.

## Packages

| Package | Description |
|---------|-------------|
| [@bitrix24/eslint-config-bitrix24](packages/eslint-config-bitrix24) | Shareable ESLint config for Bitrix24 web projects |
| [@bitrix24/eslint-config-bitrix24-mobile](packages/eslint-config-bitrix24-mobile) | Shareable ESLint config for Bitrix24 mobile (JN) projects |
| [@bitrix24/eslint-plugin-bitrix24-rules](packages/eslint-plugin-bitrix24-rules) | Custom ESLint rules for Bitrix24 |
| [@bitrix24/eslint-plugin-bitrix24-janative](packages/eslint-plugin-bitrix24-janative) | Custom ESLint rules for Bitrix24 JaNative |

## Quick Start

```bash
npm install --save-dev eslint @bitrix24/eslint-config-bitrix24
```

`eslint.config.js`:

```js
import bitrix24Config from '@bitrix24/eslint-config-bitrix24/flat';

export default [
    ...bitrix24Config,
];
```

## ESLint 8 (Legacy)

For ESLint 8 with the legacy `.eslintrc` format, use the default export:

```json
{
    "extends": ["@bitrix24/eslint-config-bitrix24"]
}
```

## License

MIT
