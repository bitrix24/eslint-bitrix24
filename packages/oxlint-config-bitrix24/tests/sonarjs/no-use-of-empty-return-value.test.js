import { RuleTester } from 'oxlint/plugins-dev';
import rule from '../../plugins/sonarjs/no-use-of-empty-return-value.js';

const used = (name) => ({ messageId: 'removeUseOfOutput', data: { name } });

new RuleTester().run('no-use-of-empty-return-value', rule, {
	valid: [
		'function f() { return 1; }\nconst x = f();',
		'function f() { a(); }\nf();',
		'function f() { a(); }\nconst g = () => f();',
		'function f() { a(); }\nfunction g() { return f(); }',
		'function f() { a(); }\nconst x = void f();',
		// the right operand of a logical expression may be a statement of its own
		'function f() { a(); }\nconst x = b() || f();',
		'async function f() { await a(); }\nconst x = f();',
		'function* f() { yield; }\nconst x = f();',
		'function f() {}\nconst x = f();',
		'const f = () => a();\nconst x = f();',
		{ code: 'declare function f(): string;\nconst x = f();', filename: 'test.ts' },
	],
	invalid: [
		{ code: 'function f() { a(); }\nconst x = f();', errors: [used('f')] },
		{ code: 'const f = () => { a(); };\nb(f());', errors: [used('f')] },
		{ code: 'function f() { return; }\nif (f()) {}', errors: [used('f')] },
		{ code: 'function f() { a(); }\nf() || b();', errors: [used('f')] },
		{ code: 'declare function f(): void;\nconst x = f();', filename: 'test.ts', errors: [used('f')] },
	],
});
