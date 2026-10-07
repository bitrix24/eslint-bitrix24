// Stylistic rules that are not about formatting (naming, structure).
export const rules = {
	'max-depth': ['error', 5],
	'max-lines-per-function': ['error', { max: 100, skipBlankLines: true, skipComments: true, IIFEs: true }],
	'new-cap': [
		'error',
		{
			newIsCap: true,
			newIsCapExceptions: [],
			capIsNew: false,
			capIsNewExceptions: ['Immutable.Map', 'Immutable.Set', 'Immutable.List'],
		},
	],
	'no-array-constructor': 'error',
	'no-lonely-if': 'error',
	'no-multi-assign': ['error'],
	'no-nested-ternary': 'error',
	'no-object-constructor': 'error',
	'no-unneeded-ternary': ['error', { defaultAssignment: false }],
	'one-var': ['error', 'never'],
	'operator-assignment': ['error', 'always'],
	'prefer-exponentiation-operator': 'error',
	'prefer-object-spread': 'error',
	'unicode-bom': ['error', 'never'],
	'@bitrix24/core/camelcase': ['error', { properties: 'never', ignoreDestructuring: false }],
};
