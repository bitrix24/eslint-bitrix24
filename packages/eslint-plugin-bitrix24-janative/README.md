# @bitrix24/eslint-plugin-bitrix24-janative

Custom ESLint rules for Bitrix24 JaNative (mobile) development.

Compatible with ESLint 8 and ESLint 9.

## Installation

```bash
npm install --save-dev @bitrix24/eslint-plugin-bitrix24-janative
```

This plugin is included automatically when using [@bitrix24/eslint-config-bitrix24-mobile](https://github.com/bitrix24/eslint-bitrix24/tree/main/packages/eslint-config-bitrix24-mobile). Manual installation is only needed if you want to use the rules independently.

## Rules

| Rule | Description |
|------|-------------|
| `no-global-require` | Disallow top-level `require()` calls outside of `jn.define()` |
| `no-static-variable-in-class` | Disallow static variable declarations in classes |

## License

MIT
