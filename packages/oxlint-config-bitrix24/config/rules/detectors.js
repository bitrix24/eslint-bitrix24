// Bug detectors of oxlint that ESLint had no counterpart for. They report code that cannot
// do what it means: `x === []`, `a && a`, `new Error()` without `throw`,
// `removeEventListener()` with a new function. Across the modules repository they found
// about 20 places, all real bugs, and nothing else.
export const rules = {
	'no-empty-static-block': 'error',
	'no-unassigned-vars': 'error',

	'oxc/bad-array-method-on-arguments': 'error',
	'oxc/bad-char-at-comparison': 'error',
	'oxc/bad-comparison-sequence': 'error',
	'oxc/bad-match-all-arg': 'error',
	'oxc/bad-min-max-func': 'error',
	'oxc/bad-object-literal-comparison': 'error',
	'oxc/bad-replace-all-arg': 'error',
	'oxc/const-comparisons': 'error',
	'oxc/double-comparisons': 'error',
	'oxc/erasing-op': 'error',
	'oxc/misrefactored-assign-op': 'error',
	'oxc/missing-throw': 'error',
	'oxc/number-arg-out-of-range': 'error',
	'oxc/uninvoked-array-callback': 'error',
	'oxc/only-used-in-recursion': 'warn',

	'unicorn/no-accessor-recursion': 'error',
	'unicorn/no-await-in-promise-methods': 'error',
	'unicorn/no-confusing-array-with': 'error',
	'unicorn/no-invalid-fetch-options': 'error',
	'unicorn/no-invalid-remove-event-listener': 'error',
	'unicorn/no-single-promise-in-promise-methods': 'warn',
	'unicorn/no-unnecessary-await': 'warn',

	'import/no-self-import': 'error',
	// not import/no-empty-named-blocks: it takes `import { type A, type B } from 'x'`, the form
	// prefer-inline-type-imports asks for, for an empty import

	'typescript/no-confusing-non-null-assertion': 'error',
	'typescript/no-duplicate-enum-values': 'error',
	'typescript/no-extra-non-null-assertion': 'error',
	'typescript/no-misused-new': 'error',
	'typescript/no-non-null-asserted-optional-chain': 'error',
	'typescript/no-unnecessary-parameter-property-assignment': 'error',
	'typescript/no-unnecessary-type-constraint': 'error',
	'typescript/no-unsafe-declaration-merging': 'error',
	'typescript/no-useless-empty-export': 'error',
	'typescript/prefer-as-const': 'error',
	'typescript/prefer-namespace-keyword': 'error',
	'typescript/triple-slash-reference': 'error',

	// vue/no-deprecated-destroyed-lifecycle and vue/require-prop-type-constructor are the
	// JS versions in vue.js: the native ones miss components declared in .js files
	'vue/no-deprecated-delete-set': 'error',
	'vue/no-deprecated-model-definition': 'error',
	'vue/no-export-in-script-setup': 'error',
	'vue/no-this-in-before-route-enter': 'error',
	'vue/valid-define-options': 'error',
};
