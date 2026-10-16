import { RuleTester } from 'oxlint/plugins-dev';
import rule from '../../plugins/sonarjs/no-identical-functions.js';

const identical = (line) => ({ messageId: 'identicalFunctions', data: { line: String(line) } });
const body = '{\n\ta();\n\tb();\n\treturn c;\n}';

new RuleTester().run('no-identical-functions', rule, {
	valid: [
		// bodies shorter than three lines
		'function f() { return a; }\nfunction g() { return a; }',
		`function f() ${body}\nfunction g() {\n\ta();\n\tb();\n\treturn d;\n}`,
		// callbacks are not checked
		`items.map(function() ${body});\nitems.map(function() ${body});`,
	],
	invalid: [
		{ code: `function f() ${body}\nfunction g() ${body}`, errors: [identical(1)] },
		{ code: `const f = () => ${body};\nconst g = function() ${body};`, errors: [identical(1)] },
		{ code: `class A {\nm() ${body}\nn() ${body}\n}`, errors: [identical(2)] },
		// formatting and comments do not matter
		{ code: `function f() ${body}\nfunction g() {\n\ta(); // first\n\tb();\n\n\treturn c;\n}`, errors: [identical(1)] },
		{ code: `function f() ${body}\nfunction g() ${body}\nfunction h() ${body}`, errors: [identical(1), identical(1)] },
	],
});
