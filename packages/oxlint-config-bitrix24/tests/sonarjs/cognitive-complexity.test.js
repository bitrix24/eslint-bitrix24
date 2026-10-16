import { RuleTester } from 'oxlint/plugins-dev';
import rule from '../../plugins/sonarjs/cognitive-complexity.js';

const tooComplex = (complexity, threshold = 0) => ({
	messageId: 'refactorFunction',
	data: { complexity: String(complexity), threshold: String(threshold) },
});

// the threshold 0 makes every case report the complexity it counted
const options = [0];

new RuleTester().run('cognitive-complexity', rule, {
	valid: [
		'function f() { return a; }',
		{ code: 'function f() { if (a) { return 1; } return 2; }', options: [1] },
		{ code: 'function f() { if (a) { b(); } }' },
		// a default value is not a decision
		{ code: 'function f() { const x = a || {}; y = y ?? []; return x; }', options },
		// nested functions are measured on their own
		{ code: 'function f() { return function() { if (a) { b(); } }; }', options: [1] },
	],
	invalid: [
		// if: +1, else if: +1, else: +1
		{ code: 'function f() { if (a) { b(); } else if (c) { d(); } else { e(); } }', options, errors: [tooComplex(3)] },
		// for: +1, nested if: +2, nested ?: +3
		{ code: 'function f() { for (;;) { if (a) { return b ? 1 : 2; } } }', options, errors: [tooComplex(6)] },
		// switch: +1, while in a case: +2, catch: +1
		{ code: 'function f() { switch (a) { case 1: while (b) {} } try {} catch (e) {} }', options, errors: [tooComplex(4)] },
		// a sequence of the same operator is +1, every change of the operator is +1 more
		{ code: 'function f() { return a && b && c || d; }', options, errors: [tooComplex(2)] },
		{ code: 'function f() { return a && (b || c) && d; }', options, errors: [tooComplex(3)] },
		// labeled jumps
		{ code: 'function f() { outer: for (;;) { for (;;) { continue outer; } } }', options, errors: [tooComplex(4)] },
		// an else-if is not nested deeper than its if
		{ code: 'function f() { if (a) { if (b) {} else if (c) {} } }', options, errors: [tooComplex(4)] },
		// the nested function is measured alone
		{
			code: 'function f() { if (a) {} return () => { if (b) { if (c) {} } }; }',
			options,
			errors: [tooComplex(1), tooComplex(3)],
		},
		{
			code: 'const f = (a) => a ? (b ? 1 : 2) : 3;',
			options: [2],
			errors: [tooComplex(3, 2)],
		},
	],
});
