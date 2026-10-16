import { RuleTester } from 'oxlint/plugins-dev';
import rule from '../../plugins/core/no-invalid-this.js';

const unexpectedThis = { messageId: 'unexpectedThis' };
const script = { sourceType: 'script' };

// oxlint takes a file without imports and exports for a script; the cases are modules unless they say otherwise
new RuleTester({ languageOptions: { sourceType: 'module' } }).run('no-invalid-this', rule, {
	valid: [
		// methods and class members
		'class A { constructor() { this.a = 1; } m() { return this.a; } static s() { return this; } }',
		'class A { a = this.b; static c = this; static { this.d = 1; } }',
		'class A { m = () => this.a; }',
		'const object = { m() { return this; }, n: function() { return this; }, get x() { return this.y; } };',
		'object.m = function() { return this; };',
		'object.m = (function() { return function() { return this; }; })();',
		'function Foo() { this.a = 1; }',
		'const Foo = function() { this.a = 1; };',
		'Foo = function() { this.a = 1; };',
		// bound receivers
		'(function() { return this; }).call(object);',
		'(function() { return this; }).apply(object, []);',
		'const bound = function() { return this; }.bind(object);',
		'items.forEach(function() { this.add(); }, object);',
		'Array.from(items, function() { return this; }, object);',
		'Reflect.apply(function() { return this; }, object, []);',
		// marked by a comment
		'/** @this Foo */\nfunction f() { return this; }',
		'/** @this Foo */\nconst f = function() { return this; };',
		'sinon.test(/* @this sinon.Sandbox */ function() { return this; });',
		// arrow functions take `this` of the code around them
		'class A { m() { return () => this.a; } }',
		// TypeScript `this` parameter
		{ code: 'function f(this: Foo) { return this.a; }', filename: 'test.ts' },
		// sloppy code: `this` is the global object
		{ code: 'this.a = 1;', languageOptions: script },
		{ code: 'function f() { return this; }', languageOptions: script },
		{ code: '(function() { function f() { return this; } })();', languageOptions: script },
	],
	invalid: [
		{ code: 'this.a = 1;', errors: [unexpectedThis] },
		{ code: 'function f() { return this; }', errors: [unexpectedThis] },
		{ code: 'const f = function() { return this; };', errors: [unexpectedThis] },
		{ code: 'const f = () => this;', errors: [unexpectedThis] },
		{ code: 'function f() { return () => this; }', errors: [unexpectedThis] },
		{ code: 'items.forEach(function() { this.add(); });', errors: [unexpectedThis] },
		{ code: '(function() { return this; }).call(null);', errors: [unexpectedThis] },
		{ code: 'class A { m() { function inner() { return this; } return inner; } }', errors: [unexpectedThis] },
		{ code: 'function Foo() { this.a = 1; }', options: [{ capIsConstructor: false }], errors: [unexpectedThis] },
		{ code: '"use strict";\nthis.a = 1;', languageOptions: script, errors: [unexpectedThis] },
		{ code: 'function f() { "use strict"; return this; }', languageOptions: script, errors: [unexpectedThis] },
	],
});
