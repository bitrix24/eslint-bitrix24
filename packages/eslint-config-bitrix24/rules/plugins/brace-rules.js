module.exports = {
	plugins: [
		'brace-rules',
	],
	rules: {
		'brace-rules/brace-on-same-line': ['error', {
			FunctionDeclaration: 'never',
			FunctionExpression: 'never',
			ArrowFunctionExpression: 'always',
			IfStatement: 'never',
			TryStatement: 'never',
			DoWhileStatement: 'never',
			WhileStatement: 'never',
			WithStatement: 'never',
			ForStatement: 'never',
			ForInStatement: 'never',
			ForOfStatement: 'never',
			SwitchStatement: 'never',
		}],
	},
};
