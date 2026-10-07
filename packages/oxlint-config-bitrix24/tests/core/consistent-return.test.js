import { RuleTester } from 'oxlint/plugins-dev';
import rule from '../../plugins/core/consistent-return.js';

new RuleTester().run('consistent-return', rule, {
	valid: [
		'function f() { return; }',
		'function f() { if (a) { return 1; } return 2; }',
		'function f() { if (a) { return 1; } else { return 2; } }',
		'function f() { if (a) { return 1; } throw new Error(); }',
		'function f() { try { return 1; } catch (e) { return 2; } }',
		'function f() { try { a(); } finally { return 1; } }',
		'function f() { switch (a) { case 1: return 1; default: return 2; } }',
		'function f() { while (true) { if (a) { return 1; } } }',
		'function f() { for (;;) { if (a) { return 1; } } }',
		'function f() { if (a) { return; } b(); }',
		'function f() { return 1; function g() { return; } }',
		'const f = () => a;',
		'const f = () => { return a; };',
		'class A { m() { if (a) { return 1; } return 2; } }',
		{ code: 'function f() { if (a) { return undefined; } return; }', options: [{ treatUndefinedAsUnspecified: true }] },
	],
	invalid: [
		{
			code: 'function f() { if (a) { return 1; } return; }',
			errors: [{ messageId: 'missingReturnValue', data: { name: "Function 'f'" } }],
		},
		{
			code: 'function f() { if (a) { return; } return 1; }',
			errors: [{ messageId: 'unexpectedReturnValue', data: { name: "Function 'f'" } }],
		},
		{
			code: 'function f() { if (a) { return 1; } }',
			errors: [{ messageId: 'missingReturn', data: { name: "function 'f'" } }],
		},
		{
			code: 'function f() { switch (a) { case 1: return 1; } }',
			errors: [{ messageId: 'missingReturn' }],
		},
		{
			code: 'function f() { while (true) { if (a) { return 1; } break; } }',
			errors: [{ messageId: 'missingReturn' }],
		},
		{
			code: 'class A { m() { if (a) { return 1; } } }',
			errors: [{ messageId: 'missingReturn', data: { name: "method 'm'" } }],
		},
		{
			code: 'const f = () => { if (a) { return 1; } };',
			errors: [{ messageId: 'missingReturn', data: { name: 'arrow function' } }],
		},
	],
});
