import { RuleTester } from 'oxlint/plugins-dev';
import rule from '../../plugins/core/dot-notation.js';

const useDot = (key) => ({ messageId: 'useDot', data: { key } });

new RuleTester().run('dot-notation', rule, {
	valid: [
		'a.b;',
		'a[b];',
		"a['b-c'];",
		"a['1b'];",
		'a[`${b}`];',
		'a[0];',
		{ code: "a['class'];", options: [{ allowKeywords: false }] },
	],
	invalid: [
		{ code: "a['b'];", output: 'a.b;', errors: [useDot("'b'")] },
		{ code: 'a["b"];', output: 'a.b;', errors: [useDot('"b"')] },
		{ code: 'a[`b`];', output: 'a.b;', errors: [useDot('`b`')] },
		{ code: "a?.['b'];", output: 'a?.b;', errors: [useDot("'b'")] },
		{ code: "a['class'];", output: 'a.class;', errors: [useDot("'class'")] },
		// adjacent fixes are applied in separate passes
		{ code: "a['b']['c'];", output: "a.b['c'];", errors: [useDot("'b'"), useDot("'c'")] },
		{ code: "a[/* keep */ 'b'];", output: null, errors: [useDot("'b'")] },
		{ code: "1['toString']();", output: null, errors: [useDot("'toString'")] },
	],
});
