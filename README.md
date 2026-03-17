# eslint-bitrix24

ESLint shareable configs and plugins for the Bitrix24 JavaScript style guide.

Requires ESLint 9 (flat config). For ESLint 8, use v1.x of the config packages.

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
import bitrix24 from '@bitrix24/eslint-config-bitrix24';

export default [
    { ignores: ['**/dist/', '**/*.bundle.js'] },
    ...bitrix24,
];
```

With mobile support:

```bash
npm install --save-dev @bitrix24/eslint-config-bitrix24-mobile
```

```js
import bitrix24 from '@bitrix24/eslint-config-bitrix24';
import bitrix24Mobile from '@bitrix24/eslint-config-bitrix24-mobile';

export default [
    { ignores: ['**/dist/', '**/*.bundle.js'] },
    ...bitrix24,
    ...bitrix24Mobile,
];
```

See individual package READMEs for granular exports and customization options.

## License

MIT
