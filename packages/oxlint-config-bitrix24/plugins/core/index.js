// Replacements of ESLint core rules that oxlint has no native version of.
// Disable directives may name them by their ESLint ids (`camelcase`, ...).
import { withLegacyNames } from '../legacy-names.js';
import camelcase from './camelcase.js';
import consistentReturn from './consistent-return.js';
import dotNotation from './dot-notation.js';

export default withLegacyNames({
	meta: { name: '@bitrix24/core' },
	rules: {
		'camelcase': camelcase,
		'consistent-return': consistentReturn,
		'dot-notation': dotNotation,
	},
}, (name) => name);
