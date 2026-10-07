// Code quality. Replaces eslint-plugin-sonarjs (cognitive-complexity) with native rules.
export const rules = {
	'complexity': ['warn', 15],
	'oxc/branches-sharing-code': 'warn',
};
