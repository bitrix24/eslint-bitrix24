import bitrix24MobileOverrides from './overrides.js';

export default [
	{
		files: [
			'**/install/mobileapp/**/*.js',
			'**/install/mobileapp/**/*.json',
			'**/dev/mobileapp/**/*.js',
			'**/dev/mobileapp/**/*.json',
		],
		...bitrix24MobileOverrides,
	},
];
