import { RuleTester } from 'oxlint/plugins-dev';
import rule from '../../plugins/core/camelcase.js';

const notCamelCase = (name) => ({ messageId: 'notCamelCase', data: { name } });
const options = [{ properties: 'never', ignoreDestructuring: false }];

new RuleTester().run('camelcase', rule, {
	valid: [
		{ code: 'const fooBar = 1;', options },
		{ code: 'const FOO_BAR = 1;', options },
		{ code: 'const _private = 1; const trailing_ = 2; const __proto = 3;', options },
		{ code: 'obj.foo_bar = 1;', options },
		{ code: 'const obj = { foo_bar: 1 };', options },
		{ code: 'const { foo_bar: fooBar } = obj;', options },
		{ code: "import { foo_bar as fooBar } from 'mod'; fooBar();", options },
		{ code: 'class A { some_method() {} }', options },
		{ code: 'const x = obj.some_prop;', options },
		{ code: 'const foo_bar = 1;', options: [{ allow: ['foo_bar'] }] },
		{ code: 'const foo_bar = 1;', options: [{ allow: ['^foo_'] }] },
		{ code: 'const { foo_bar } = obj; use(foo_bar);', options: [{ ignoreDestructuring: true }] },
		{ code: "import { foo_bar } from 'mod'; use(foo_bar);", options: [{ ignoreImports: true }] },
		{ code: 'use(some_global);', options: [{ ignoreGlobals: true }] },
	],
	invalid: [
		{ code: 'const foo_bar = 1;', options, errors: [notCamelCase('foo_bar')] },
		{ code: 'function do_it() {}', options, errors: [notCamelCase('do_it')] },
		{ code: 'class Some_class {}', options, errors: [notCamelCase('Some_class')] },
		{ code: 'function f(some_value) { return some_value; }', options, errors: [notCamelCase('some_value'), notCamelCase('some_value')] },
		{ code: 'const { foo_bar } = obj;', options, errors: [notCamelCase('foo_bar')] },
		{ code: "import { foo_bar } from 'mod';", options, errors: [notCamelCase('foo_bar')] },
		{ code: 'try {} catch (some_error) {}', options, errors: [notCamelCase('some_error')] },
		{ code: 'const a = 1; export { a as some_name };', options, errors: [notCamelCase('some_name')] },
		{ code: 'use(some_global);', options, errors: [notCamelCase('some_global')] },
	],
});
