// Code quality: rules of eslint-plugin-sonarjs (@bitrix24/sonarjs) and native rules.
export const rules = {
	'@bitrix24/sonarjs/cognitive-complexity': 'warn',
	'@bitrix24/sonarjs/no-duplicated-branches': 'error',
	'@bitrix24/sonarjs/no-extra-arguments': 'error',
	'@bitrix24/sonarjs/no-identical-functions': 'error',
	'@bitrix24/sonarjs/no-use-of-empty-return-value': 'error',
	'oxc/branches-sharing-code': 'warn',
};
