import babelParser from '@babel/eslint-parser';

export default {
	name: 'bitrix24/flow',
	languageOptions: {
		parser: babelParser,
		parserOptions: {
			requireConfigFile: false,
			babelOptions: {
				plugins: ['@babel/plugin-syntax-flow'],
			},
		},
	},
};
