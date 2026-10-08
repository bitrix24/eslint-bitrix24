// The cases of ../no-native-dom-methods.test.js, run by oxlint as TypeScript, the way tools
// hand Flow files to oxlint.
import { RuleTester } from 'oxlint/plugins-dev';
import rule from '../../rules/no-native-dom-methods.js';
import { valid, invalid } from '../no-native-dom-methods.cases.js';

const ruleTester = new RuleTester({
	languageOptions: {
		parserOptions: { lang: 'ts' },
	},
});

ruleTester.run('no-native-dom-methods', rule, { valid, invalid });
