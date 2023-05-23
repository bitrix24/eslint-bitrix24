module.exports = {
	plugins: [
		'unicorn',
	],
	rules: {
		// https://github.com/sindresorhus/eslint-plugin-unicorn#rules
		'unicorn/better-regex': 'error',
		'unicorn/consistent-destructuring': 'error',
		'unicorn/empty-brace-spaces': 'error',
		'unicorn/error-message': 'error',
		'unicorn/escape-case': 'error',
		'unicorn/explicit-length-check': 'error',
		'unicorn/filename-case': 'error',
		'unicorn/new-for-builtins': 'error',
		'unicorn/no-abusive-eslint-disable': 'error',
		'unicorn/no-array-callback-reference': 'error',
		'unicorn/no-array-method-this-argument': 'error',
		'unicorn/no-array-push-push': 'error',
		'unicorn/no-array-reduce': 'error',
		'unicorn/no-console-spaces': 'error',
		'unicorn/no-empty-file': 'error',
		'unicorn/no-for-loop': 'error',
		'unicorn/no-instanceof-array': 'error',
		'unicorn/no-lonely-if': 'error',
		'no-negated-condition': 'off',
		'unicorn/no-negated-condition': 'error',
		'no-nested-ternary': 'off',
		'unicorn/no-nested-ternary': 'error',
		'unicorn/no-new-array': 'error',
		'unicorn/no-object-as-default-parameter': 'warn',
		'unicorn/no-thenable': 'error',
		'unicorn/no-this-assignment': 'error',
		'unicorn/no-typeof-undefined': 'error',
		'unicorn/no-unreadable-array-destructuring': 'error',
		'unicorn/no-unreadable-iife': 'error',
		'unicorn/no-useless-fallback-in-spread': 'error',
		'unicorn/no-useless-length-check': 'error',
		'unicorn/no-useless-spread': 'error',
		'unicorn/no-useless-undefined': 'error',
		'unicorn/no-zero-fractions': 'error',
		'unicorn/number-literal-case': 'error',
		'unicorn/numeric-separators-style': ['error', {
			number: { minimumDigits: 6, groupLength: 3 },
			hexadecimal: { minimumDigits: 12, groupLength: 2 },
			binary: { minimumDigits: 12, groupLength: 4 },
			octal: { minimumDigits: 12, groupLength: 4 },
		}],
		'unicorn/prefer-array-find': 'error',
		'unicorn/prefer-array-flat': 'error',
		'unicorn/prefer-array-flat-map': 'error',
		'unicorn/prefer-array-index-of': 'error',
		'unicorn/prefer-array-some': 'error',
		'unicorn/prefer-code-point': 'error',
		'unicorn/prefer-date-now': 'error',
		'unicorn/prefer-includes': 'error',
		'unicorn/prefer-logical-operator-over-ternary': 'error',
		'unicorn/prefer-math-trunc': 'error',
		'unicorn/prefer-modern-math-apis': 'error',
		'unicorn/prefer-negative-index': 'error',
		'unicorn/prefer-object-from-entries': 'error',
		'unicorn/prefer-optional-catch-binding': 'error',
		'unicorn/prefer-regexp-test': 'error',
		'unicorn/prefer-set-has': 'error',
		'unicorn/prefer-set-size': 'error',
		'unicorn/prefer-spread': 'error',
		'unicorn/prefer-string-slice': 'error',
		'unicorn/prefer-string-starts-ends-with': 'error',
		'unicorn/prefer-string-trim-start-end': 'error',
		'unicorn/prefer-switch': 'error',
		'unicorn/prefer-ternary': ['error', 'only-single-line'],
		'unicorn/prefer-type-error': 'error',
		'unicorn/require-array-join-separator': 'error',
		'unicorn/require-number-to-fixed-digits-argument': 'error',
		'unicorn/template-indent': 'error',
		'unicorn/throw-new-error': 'error',

		// ToDo discuss these rules later
		// 'unicorn/prefer-number-properties': 'off',
		// 'unicorn/prefer-prototype-methods': 'off',
		// 'unicorn/no-array-for-each': 'off',
		// 'unicorn/prevent-abbreviations': 'off',
		// 'unicorn/prefer-reflect-apply': 'off',
		// 'unicorn/no-static-only-class': 'off',

		// fixes static functions to static variables (which aren't supported in ios 14)
		// 'unicorn/prefer-native-coercion-functions': 'error',

		// ToDo make custom rule
		// 'unicorn/no-invalid-remove-event-listener': 'off',

		// ToDo enable this by default when iOS >= 13.4
		// 'unicorn/prefer-string-replace-all': 'off',
	},
};
