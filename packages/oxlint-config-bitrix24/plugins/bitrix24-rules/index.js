// @bitrix24/eslint-plugin-bitrix24-rules for oxlint: the rules of the plugin, with some of
// them replaced by versions that report fewer false positives. The plugin itself, which
// ESLint uses, is left as it is. The rule ids, options and messages stay the same, so
// disable directives keep working.
import plugin from '@bitrix24/eslint-plugin-bitrix24-rules';
import * as noBx from './no-bx.js';
import * as noNativeDialogs from './no-native-dialogs.js';
import * as noNativeDomMethods from './no-native-dom-methods.js';
import * as noNativeEventsBinding from './no-native-events-binding.js';
import * as noPseudoPrivate from './no-pseudo-private.js';
import * as noStyle from './no-style.js';
import * as noTypeof from './no-typeof.js';

const replacements = {
	'no-bx': noBx,
	'no-native-dialogs': noNativeDialogs,
	'no-native-dom-methods': noNativeDomMethods,
	'no-native-events-binding': noNativeEventsBinding,
	'no-pseudo-private': noPseudoPrivate,
	'no-style': noStyle,
	'no-typeof': noTypeof,
};

export default {
	...plugin,
	meta: { name: '@bitrix24/bitrix24-rules' },
	rules: {
		...plugin.rules,
		...Object.fromEntries(Object.entries(replacements).map(([name, rule]) => [name, { meta: plugin.rules[name].meta, create: rule.create }])),
	},
};
