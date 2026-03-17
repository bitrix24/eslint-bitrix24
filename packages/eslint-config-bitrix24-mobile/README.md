# @bitrix24/eslint-config-bitrix24-mobile

Shareable ESLint config for Bitrix24 mobile (JaNative) projects.

Provides mobile-specific globals and rule overrides on top of [@bitrix24/eslint-config-bitrix24](https://github.com/bitrix24/eslint-bitrix24/tree/main/packages/eslint-config-bitrix24).

Requires ESLint 9 (flat config). For ESLint 8, use v1.x of this package.

## Installation

```bash
npm install --save-dev eslint @bitrix24/eslint-config-bitrix24 @bitrix24/eslint-config-bitrix24-mobile
```

## Usage

### Preset (recommended)

The default export applies mobile overrides to `**/mobileapp/**` files:

```js
import bitrix24 from '@bitrix24/eslint-config-bitrix24';
import bitrix24Mobile from '@bitrix24/eslint-config-bitrix24-mobile';

export default [
    { ignores: ['**/dist/', '**/*.bundle.js'] },
    ...bitrix24,
    ...bitrix24Mobile,
];
```

### Custom file patterns

Use `./overrides` to apply mobile rules to specific files:

```js
import bitrix24 from '@bitrix24/eslint-config-bitrix24';
import bitrix24MobileOverrides from '@bitrix24/eslint-config-bitrix24-mobile/overrides';

export default [
    ...bitrix24,
    { files: ['**/mobile/**/*.js'], ...bitrix24MobileOverrides },
];
```

## Exports

| Export | Type | Description |
|---|---|---|
| `.` | array (preset) | Mobile overrides for `**/mobileapp/**` files |
| `./overrides` | object | Mobile globals + janative rules + relaxed web rules (no `files`) |

## What's included

On top of the base Bitrix24 config:

- JaNative global variables (`jn`, `Application`, `PageManager`, UI components, etc.)
- [@bitrix24/eslint-plugin-bitrix24-janative](https://github.com/bitrix24/eslint-bitrix24/tree/main/packages/eslint-plugin-bitrix24-janative) rules
- Disables web-specific Bitrix24 rules that don't apply to mobile

## License

MIT
