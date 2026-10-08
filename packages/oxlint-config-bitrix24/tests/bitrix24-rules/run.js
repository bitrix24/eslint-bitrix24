// Runs a rule of the oxlint @bitrix24/bitrix24-rules plugin on cases parsed as TypeScript, the
// way tools hand Flow files to oxlint. Every case is a module: oxlint takes code without
// import or export for a script.
import { RuleTester } from 'oxlint/plugins-dev';
import plugin from '../../plugins/bitrix24-rules/index.js';

const ruleTester = new RuleTester({
	languageOptions: {
		parserOptions: { lang: 'ts' },
	},
});

export function run(name, { valid, invalid })
{
	ruleTester.run(name, plugin.rules[name], { valid, invalid });
}
