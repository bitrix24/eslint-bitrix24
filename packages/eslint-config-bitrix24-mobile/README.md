# @bitrix24/eslint-config-bitrix24-mobile

Shareable ESLint config for Bitrix24 mobile (JaNative) projects.

Extends [@bitrix24/eslint-config-bitrix24](https://github.com/bitrix24/eslint-bitrix24/tree/main/packages/eslint-config-bitrix24) with mobile-specific globals and rule overrides.

Supports ESLint 8 (legacy) and ESLint 9 (flat config).

## Installation

```bash
npm install --save-dev eslint @bitrix24/eslint-config-bitrix24-mobile
```

## Usage

### ESLint 9 (Flat Config)

Apply the full config (base + mobile) to the entire project:

```js
import bitrix24MobileConfig from '@bitrix24/eslint-config-bitrix24-mobile/flat';

export default [
    ...bitrix24MobileConfig,
];
```

Or apply mobile overrides only to specific files (when the base config is already included):

```js
import bitrix24Config from '@bitrix24/eslint-config-bitrix24/flat';
import bitrix24MobileConfig from '@bitrix24/eslint-config-bitrix24-mobile/flat';

export default [
    ...bitrix24Config,

    {
        files: ['**/install/mobileapp/**/*.js'],
        ...bitrix24MobileConfig.overrides,
    },
];
```

### ESLint 8 (Legacy)

`.eslintrc.json`:

```json
{
    "extends": ["@bitrix24/eslint-config-bitrix24-mobile"]
}
```

## What's Included

On top of the base Bitrix24 config, this adds:

- JaNative global variables (`jn`, `Application`, `PageManager`, UI components, etc.)
- [@bitrix24/eslint-plugin-bitrix24-janative](https://github.com/bitrix24/eslint-bitrix24/tree/main/packages/eslint-plugin-bitrix24-janative) rules
- Disables web-specific Bitrix24 rules that don't apply to mobile

## License

MIT
