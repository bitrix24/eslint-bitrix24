module.exports = {
	rules: {
		// enforce or disallow variable initializations at definition
		'init-declarations': 'error',

		// disallow the catch clause parameter name being the same as a variable in the outer scope
		'no-catch-shadow': 'off',

		// disallow deletion of variables
		'no-delete-var': 'error',

		// disallow labels that share a name with a variable
		// https://eslint.org/docs/rules/no-label-var
		'no-label-var': 'error',

		// disallow specific globals
		'no-restricted-globals': [
			'error',
			{
				name: 'isFinite',
				message:
					'Use Number.isFinite instead https://github.com/airbnb/javascript#standard-library--isfinite',
			},
			{
				name: 'isNaN',
				message:
					'Use Number.isNaN instead https://github.com/airbnb/javascript#standard-library--isnan',
			},
		],

		// disallow declaration of variables already declared in the outer scope
		'no-shadow': 'warn',

		// disallow shadowing of names such as arguments
		'no-shadow-restricted-names': 'error',

		// disallow use of undeclared variables unless mentioned in a /*global */ block
		'no-undef': 'error',

		// disallow use of undefined when initializing variables
		'no-undef-init': 'error',

		// https://eslint.org/docs/rules/no-undefined
		'no-undefined': 'off',

		'no-unused-vars': ['error', { vars: 'all', args: 'none', ignoreRestSiblings: true }],

		// disallow use of variables before they are defined
		'no-use-before-define': ['off', { functions: false, classes: true, variables: true }],

		'vars-on-top': 'off',

	},
};
