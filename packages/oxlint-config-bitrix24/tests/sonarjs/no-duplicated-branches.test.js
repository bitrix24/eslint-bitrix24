import { RuleTester } from 'oxlint/plugins-dev';
import rule from '../../plugins/sonarjs/no-duplicated-branches.js';

const same = (type, line) => ({ messageId: 'sameConditionalBlock', data: { type, line: String(line) } });

new RuleTester().run('no-duplicated-branches', rule, {
	valid: [
		'if (a) { b(); } else { c(); }',
		// single-line branches may repeat when there is an else
		'if (a) { b(); } else if (c) { d(); } else { b(); }',
		'switch (a) { case 1: b(); break; case 2: c(); break; default: b(); }',
		// fall-through cases are not duplicates
		'switch (a) { case 1: case 2: b(); break; default: c(); }',
	],
	invalid: [
		{
			code: 'if (a) {\n\tb();\n\tc();\n} else if (d) {\n\tb();\n\tc();\n}',
			errors: [same('branch', 1)],
		},
		{
			code: 'if (a) {\n\tb();\n\tc();\n} else if (d) {\n\te();\n} else {\n\tb();\n\tc();\n}',
			errors: [same('branch', 1)],
		},
		// without an else all branches being the same is reported whatever their size
		{ code: 'if (a) { b(); } else if (c) { b(); }', errors: [same('branch', 1)] },
		{
			code: 'switch (a) {\n\tcase 1:\n\t\tb();\n\t\tc();\n\t\tbreak;\n\tcase 2:\n\t\tb();\n\t\tc();\n\t\tbreak;\n\tdefault:\n\t\td();\n}',
			errors: [same('case', 2)],
		},
		{
			code: 'switch (a) {\n\tcase 1: {\n\t\tb();\n\t\tc();\n\t\tbreak;\n\t}\n\tcase 2:\n\t\tb();\n\t\tc();\n\t\tbreak;\n\tdefault:\n\t\td();\n}',
			errors: [same('case', 2)],
		},
		{ code: 'switch (a) { case 1: b(); break; case 2: b(); break; }', errors: [same('case', 1)] },
	],
});
