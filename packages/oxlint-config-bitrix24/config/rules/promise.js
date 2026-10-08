// eslint-plugin-promise: native oxlint rules.
export const rules = {
	'promise/no-return-wrap': 'error',
	'promise/param-names': 'error',
	'promise/catch-or-return': ['error', { allowFinally: true }],
	'promise/no-nesting': 'warn',
	'promise/no-promise-in-callback': 'warn',
	'promise/no-callback-in-promise': 'warn',
	'promise/no-new-statics': 'error',
	'promise/no-return-in-finally': 'warn',
	'promise/valid-params': 'warn',
};
