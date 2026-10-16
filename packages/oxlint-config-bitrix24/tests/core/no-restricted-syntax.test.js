import { RuleTester } from 'oxlint/plugins-dev';
import rule from '../../plugins/core/no-restricted-syntax.js';

const forIn = { selector: 'ForInStatement', message: 'for..in is not allowed.' };

new RuleTester().run('no-restricted-syntax', rule, {
	valid: [
		{ code: 'for (const key of keys) {}', options: [forIn] },
		{ code: 'for (const key in object) {}' },
		{ code: 'a.skip(1);', options: ["CallExpression[arguments.length=0][callee.property.name='skip']"] },
	],
	invalid: [
		{
			code: 'for (const key in object) {}',
			options: [forIn],
			errors: [{ messageId: 'restrictedSyntax', data: { message: 'for..in is not allowed.' } }],
		},
		{
			code: 'a.skip();',
			options: ["CallExpression[arguments.length=0][callee.property.name='skip']"],
			errors: [{ messageId: 'restrictedSyntax', data: { message: "Using 'CallExpression[arguments.length=0][callee.property.name='skip']' is not allowed." } }],
		},
		{
			code: 'for (const key in object) { debugger; }',
			options: [forIn, { selector: 'DebuggerStatement' }],
			errors: [
				{ messageId: 'restrictedSyntax', data: { message: 'for..in is not allowed.' } },
				{ messageId: 'restrictedSyntax', data: { message: "Using 'DebuggerStatement' is not allowed." } },
			],
		},
		{
			code: 'for (const key in object) {}',
			options: [forIn, { selector: 'ForInStatement', message: 'second' }],
			errors: [
				{ messageId: 'restrictedSyntax', data: { message: 'for..in is not allowed.' } },
				{ messageId: 'restrictedSyntax', data: { message: 'second' } },
			],
		},
	],
});
