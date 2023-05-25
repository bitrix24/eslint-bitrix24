module.exports = {
	plugins: [
		'@saji/brace-rules',
	],
	rules: {
		'@saji/brace-rules/brace-on-same-line': ['error', {
			// Vue component object methods (e.g. data()) are determined as FunctionExpression
			FunctionExpression: 'ignore',
			FunctionDeclaration: 'never',
			ArrowFunctionExpression: 'always',
			IfStatement: 'never',
			TryStatement: 'never',
			CatchClause: 'never',
			DoWhileStatement: 'never',
			WhileStatement: 'never',
			WithStatement: 'never',
			ForStatement: 'never',
			ForInStatement: 'never',
			ForOfStatement: 'never',
			SwitchStatement: 'never',
			ClassDeclaration: 'never',
			MethodDeclaration: 'never',
			ExportClass: 'never',
			ExportClassAnon: 'never',
			ExportFunctionAnon: 'never',
		}],
	},
};
