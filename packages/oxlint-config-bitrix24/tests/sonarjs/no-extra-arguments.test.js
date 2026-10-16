import { RuleTester } from 'oxlint/plugins-dev';
import rule from '../../plugins/sonarjs/no-extra-arguments.js';

const tooMany = (expected, provided) => ({ messageId: 'tooManyArguments', data: { expected, provided } });

new RuleTester().run('no-extra-arguments', rule, {
	valid: [
		'function f(a, b) { return a + b; }\nf(1, 2);',
		'function f(a, ...rest) { return rest; }\nf(1, 2, 3);',
		'function f() { return arguments.length; }\nf(1, 2);',
		'function f() { const g = () => arguments; return g; }\nf(1);',
		// an empty function without parameters is a stub that accepts anything
		'function noop() {}\nnoop(1, 2);',
		// unknown functions are not checked
		'object.f(1, 2, 3);',
		'function f(a) { return a; }\nfunction f(a, b) { return a + b; }\nf(1, 2);',
	],
	invalid: [
		{ code: 'function f(a) { return a; }\nf(1, 2);', errors: [tooMany('1 argument', '2 were')] },
		{ code: 'const f = () => 1;\nf(1);', errors: [tooMany('no arguments', '1 was')] },
		{ code: 'const f = function(a, b) { return a + b; };\nf(1, 2, 3);', errors: [tooMany('2 arguments', '3 were')] },
		{ code: '(function(a) { return a; })(1, 2);', errors: [tooMany('1 argument', '2 were')] },
		// `arguments` of a nested function belongs to it
		{ code: 'function f() { return function() { return arguments; }; }\nf(1);', errors: [tooMany('no arguments', '1 was')] },
	],
});
