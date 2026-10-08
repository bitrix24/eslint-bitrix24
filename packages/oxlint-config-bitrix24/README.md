# @bitrix24/oxlint-config-bitrix24

Shareable [oxlint](https://oxc.rs/docs/guide/usage/linter) config for the Bitrix24 JavaScript style guide.
It is the oxlint counterpart of [@bitrix24/eslint-config-bitrix24](../eslint-config-bitrix24).

## Installation

```bash
npm install --save-dev oxlint@1.87.0 @bitrix24/oxlint-config-bitrix24
```

oxlint is pinned to an exact version: JS plugins are in alpha and do not follow semver.

## Usage

`oxlint.config.ts`:

```ts
import bitrix24 from '@bitrix24/oxlint-config-bitrix24';

export default {
	extends: [bitrix24],
	ignorePatterns: ['**/dist/', '**/*.bundle.js'],
};
```

The config is a JS module: its JS plugins are referenced by absolute paths inside the package,
so it can be extended from any location.

## What is inside

- **Native oxlint rules** wherever oxlint has them.
- **JS plugins**, only for rules oxlint has no working native version of:

  | Plugin | Rules |
  |--------|-------|
  | `@bitrix24/bitrix24-rules` | [@bitrix24/eslint-plugin-bitrix24-rules](../eslint-plugin-bitrix24-rules), seven of them replaced by versions with fewer false positives (`plugins/bitrix24-rules`) |
  | `@bitrix24/core` | `camelcase`, `dot-notation`, `consistent-return`: replacements of ESLint core rules |
  | `@stylistic` | formatting rules from `@stylistic/eslint-plugin` |
  | `@bitrix24/unicorn` | `eslint-plugin-unicorn` rules oxlint has no native version of |
  | `@bitrix24/vue` | all `eslint-plugin-vue` rules: the native ones do not recognize the components of `.js` and `.ts` files |

The third-party rules are bundled into `dist/` at build time (`npm run build`), so the package
depends neither on the ESLint plugins nor on `eslint`. License texts of the bundled code are in
`THIRD-PARTY-NOTICES.md`.

### Disable directives

Existing `eslint-disable` comments keep working:

- for native rules and `@bitrix24/bitrix24-rules`, oxlint matches them itself;
- rules of the other JS plugins also honor the ESLint-era ids: `// eslint-disable-line max-len`
  disables `@stylistic/max-len`, `camelcase` disables `@bitrix24/core/camelcase`,
  `vue/order-in-components` disables `@bitrix24/vue/order-in-components`.

### Differences from the ESLint config

- Flow syntax is not supported: oxlint has no Flow parser. Tools that lint Flow files present
  them as TypeScript under a `*.js.ts` name; the overrides treat such files as JavaScript.
- `eslint-plugin-sonarjs` is replaced with the native `complexity` (warning above 15) and
  `oxc/branches-sharing-code`.
- Bug detectors of oxlint that ESLint had no counterpart for are enabled
  (`config/rules/detectors.js`): `x === []`, `a && a`, `new Error()` without `throw`,
  `removeEventListener()` with a new function and the like.
- Vue rules check every component of `.js` and `.ts` files, not only those eslint-plugin-vue
  recognizes (a `// @vue/component` comment, `Vue.component()`, `defineComponent()` from `'vue'`):
  `plugins/vue-components.js` also recognizes components by their shape (a template with markup,
  component options) and by the factory they are passed to (`BitrixVue.component()`,
  `localComponent()`, `mutableComponent()`, `createApp()`, `defineComponent()` from `'ui.vue3'`).
- `@bitrix24/bitrix24-rules` report fewer false positives than in ESLint:
  - `no-native-dom-methods`, `no-native-events-binding` and `no-style` skip objects the file
    shows are not DOM ones (type annotations, values written to a variable);
  - `no-native-dialogs` matches names exactly;
  - `no-pseudo-private` reports class members and `this._x` only;
  - `no-bx` leaves `BX.message()` to `no-bx-message`;
  - `no-typeof` skips checks of undeclared globals and `typeof` used as a value.
- `need-alias` (checks the developer's `webpack.aliases.js`) and `no-io-without-polyfill`
  (`IntersectionObserver` needs no polyfill in supported browsers) are not enabled.
- Not carried over: `no-invalid-this`, `no-restricted-syntax` (`for..in` is covered by
  `guard-for-in`), `no-eq-null` (covered by `eqeqeq`), `no-underscore-dangle` (covered by
  `@bitrix24/bitrix24-rules/no-pseudo-private`), `no-undef-init`, `no-implicit-globals`,
  `no-return-await`, `no-dupe-args`, `no-octal`, `no-octal-escape`, `lines-around-directive`,
  `unicorn/better-regex`, `unicorn/no-array-callback-reference`, `vue/jsx-uses-vars`.
- `consistent-return` checks whether a function can reach its end structurally (return/throw,
  if/else, try, switch with default, infinite loops), not by code path analysis.
- `no-redeclare` does not check redeclaration of built-in globals.
- `env` and `globals` of the preset are declared in an override for `**/*`: oxlint does not carry
  top-level `env` and `globals` over through `extends`.

## Development

```bash
npm install
npm test        # builds dist/ and runs the tests
```

## License

MIT
