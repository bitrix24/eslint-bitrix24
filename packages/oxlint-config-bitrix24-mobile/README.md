# @bitrix24/oxlint-config-bitrix24-mobile

Shareable [oxlint](https://oxc.rs/docs/guide/usage/linter) config for Bitrix24 Mobile (JaNative)
extensions. It is the oxlint counterpart of
[@bitrix24/eslint-config-bitrix24-mobile](../eslint-config-bitrix24-mobile) and is meant to be
extended after [@bitrix24/oxlint-config-bitrix24](../oxlint-config-bitrix24).

## Installation

```bash
npm install --save-dev oxlint@1.87.0 @bitrix24/oxlint-config-bitrix24 @bitrix24/oxlint-config-bitrix24-mobile
```

## Usage

`oxlint.config.ts`:

```ts
import bitrix24 from '@bitrix24/oxlint-config-bitrix24';
import bitrix24Mobile from '@bitrix24/oxlint-config-bitrix24-mobile';

export default {
	extends: [bitrix24, bitrix24Mobile],
};
```

For files under `**/install/mobileapp/` and `**/dev/mobileapp/` the config:

- declares the JaNative globals (`jn`, `layout`, `LayoutComponent`, `View`, ...);
- enables the rules of [@bitrix24/eslint-plugin-bitrix24-janative](../eslint-plugin-bitrix24-janative),
  including the `deps-*` rules that keep `deps.php` in sync with the code;
- turns off the web-only rules of `@bitrix24/bitrix24-rules`.

## License

MIT
