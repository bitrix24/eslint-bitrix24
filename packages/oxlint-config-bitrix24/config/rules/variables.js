// Variables.
export const rules = {
	'init-declarations': 'error',
	'no-delete-var': 'error',
	'no-label-var': 'error',
	'no-restricted-globals': [
		'error',
		{
			name: 'isFinite',
			message: 'Use Number.isFinite instead https://github.com/airbnb/javascript#standard-library--isfinite',
		},
		{
			name: 'isNaN',
			message: 'Use Number.isNaN instead https://github.com/airbnb/javascript#standard-library--isnan',
		},
	],
	'no-shadow': 'warn',
	'no-shadow-restricted-names': 'error',
	'no-undef': 'error',
	'no-unused-vars': ['error', { vars: 'all', args: 'none', ignoreRestSiblings: true }],
};
