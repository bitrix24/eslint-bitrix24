/**
 * @fileoverview Enforce brace placement per construct type (Allman, 1TBS, or per-node).
 *
 * Based on @saji/eslint-plugin-brace-rules by Joshua Searles.
 * Rewritten without lodash dependency and with ESLint 8/9 compatibility.
 */
const BLOCK_TYPES = [
	"ArrowFunctionExpression",
	"ClassDeclaration",
	"DoWhileStatement",
	"ExportClass",
	"ExportClassAnon",
	"ExportFunction",
	"ExportFunctionAnon",
	"ForInStatement",
	"ForOfStatement",
	"ForStatement",
	"FunctionDeclaration",
	"FunctionExpression",
	"IfStatement",
	"MethodDeclaration",
	"SwitchStatement",
	"TryStatement",
	"WhileStatement",
	"WithStatement",
];

function makePreset(value) {
	const preset = {};
	for (const type of BLOCK_TYPES) {
		preset[type] = value;
	}
	return preset;
}

const PRESETS = {
	"1tbs": makePreset("always"),
	allman: makePreset("never"),
	get stroustrup() {
		return {
			...PRESETS["1tbs"],
			noCuddledElse: true,
			noCuddledCatchFinally: true,
		};
	},
};

function genSchemaProps(defaults) {
	const props = defaults ? { ...defaults } : {};
	for (const type of BLOCK_TYPES) {
		props[type] = { enum: ["always", "never", "ignore"] };
	}
	return props;
}

export default {
	meta: {
		type: "layout",
		fixable: "whitespace",
		schema: [
			{
				oneOf: [
					{ enum: ["1tbs", "stroustrup", "allman"] },
					{
						type: "object",
						properties: genSchemaProps(),
					},
				],
			},
			{
				type: "object",
				properties: genSchemaProps({
					allowSingleLine: { type: "boolean" },
					noCuddledElse: { type: "boolean" },
					noCuddledCatchFinally: { type: "boolean" },
				}),
				additionalProperties: false,
			},
		],
	},

	create(context) {
		const sourceCode = context.sourceCode || context.getSourceCode();
		let style = context.options[0] || "1tbs";

		if (typeof style === "string") {
			style = PRESETS[style];
		}

		const options = { ...style, ...context.options[1] };

		for (const type of BLOCK_TYPES) {
			if (type in options) {
				if (options[type] === "ignore") {
					options[type] = null;
				} else {
					options[type] = options[type] === "always";
				}
			}
		}

		const OPEN_MESSAGE = "Opening curly brace does not appear on the same line as controlling statement.";
		const OPEN_MESSAGE_ALLMAN = "Opening curly brace appears on the same line as controlling statement.";
		const BODY_MESSAGE = "Statement inside of curly braces should be on next line.";
		const CLOSE_MESSAGE = "Closing curly brace does not appear on the same line as the subsequent block.";
		const CLOSE_MESSAGE_SINGLE = "Closing curly brace should be on the same line as opening curly brace or on the line after the previous block.";
		const CLOSE_MESSAGE_STROUSTRUP_ALLMAN = "Closing curly brace appears on the same line as the subsequent block.";

		function insertBreakBefore(token, whitespace) {
			return function(fixer) {
				return fixer.insertTextBefore(token, "\n" + (whitespace || ""));
			};
		}

		function removeBreakBetween(startToken, endToken) {
			return function(fixer) {
				return fixer.replaceTextRange([startToken.range[1], endToken.range[0]], " ");
			};
		}

		function getWhitespaceBefore(token) {
			const src = sourceCode.getText(token, token.loc.start.column);
			const indent = /^(\s+)/.exec(src);
			return indent ? indent[1] : "";
		}

		function isBlock(node) {
			return node && (node.type === "BlockStatement" || node.type === "ClassBody");
		}

		function isCurlyPunctuator(token) {
			return token.value === "{" || token.value === "}";
		}

		function checkBlock(node, expectSameLine, whitespace, parentNode) {
			if (!isBlock(node)) {
				return;
			}

			const previousToken = sourceCode.getTokenBefore(node);
			const curlyToken = sourceCode.getFirstToken(node);
			const curlyTokenEnd = sourceCode.getLastToken(node);

			const allOnSameLine = previousToken.loc.start.line === curlyTokenEnd.loc.start.line;
			if (allOnSameLine && options.allowSingleLine) {
				return;
			}

			const startSameLine = previousToken.loc.start.line === curlyToken.loc.start.line;
			if (startSameLine !== expectSameLine) {
				context.report({
					node: parentNode || node,
					message: startSameLine ? OPEN_MESSAGE_ALLMAN : OPEN_MESSAGE,
					fix: startSameLine
						? insertBreakBefore(curlyToken, whitespace)
						: removeBreakBetween(previousToken, curlyToken),
				});
			}

			if (!node.body.length) {
				return;
			}

			if (curlyToken.loc.start.line === node.body[0].loc.start.line) {
				context.report({
					node: node.body[0],
					message: BODY_MESSAGE,
					fix: insertBreakBefore(curlyToken, " ".repeat(node.body[0].loc.start.column)),
				});
			}

			const lastToken = node.body[node.body.length - 1];
			const endOnSameLine = curlyTokenEnd.loc.start.line === lastToken.loc.start.line;
			if (endOnSameLine) {
				context.report({
					node: lastToken,
					message: CLOSE_MESSAGE_SINGLE,
					fix: insertBreakBefore(curlyTokenEnd, whitespace),
				});
			}
		}

		function checkForCuddled(node, previousToken, firstToken, expectSameLine, leadingWhitespace) {
			const closeOnSameLine = previousToken.loc.start.line === firstToken.loc.start.line;

			if (expectSameLine) {
				if (!closeOnSameLine && isCurlyPunctuator(previousToken)) {
					context.report({
						node,
						message: CLOSE_MESSAGE,
						fix: removeBreakBetween(previousToken, firstToken),
					});
				}
			} else if (closeOnSameLine) {
				context.report({
					node,
					message: CLOSE_MESSAGE_STROUSTRUP_ALLMAN,
					fix: insertBreakBefore(firstToken, leadingWhitespace),
				});
			}
		}

		function checkNode(type) {
			return function(node) {
				let nodeType;
				if (node.type === "FunctionExpression" && node.parent.type === "MethodDefinition") {
					nodeType = "MethodDeclaration";
				} else {
					nodeType = type;
				}

				if (options[nodeType] == null) {
					return;
				}

				checkBlock(node.body, options[nodeType], getWhitespaceBefore(node), node);
			};
		}

		function checkExportTypeDeclaration(targetType, exportType, exportAnonType) {
			const hasExportAnonOpt = exportAnonType && exportAnonType in options;
			const hasExportOpt = exportType && exportType in options;
			const hasTargetOpt = targetType && targetType in options;

			if (!hasTargetOpt && !hasExportOpt && !hasExportAnonOpt) {
				return function() {};
			}

			return function(node) {
				if (node.type !== targetType) {
					return;
				}

				const parentType = node.parent && node.parent.type;
				let optType = hasTargetOpt ? targetType : null;

				if (parentType === "ExportDefaultDeclaration" || parentType === "ExportNamedDeclaration") {
					if (hasExportOpt) {
						optType = exportType;
					}

					if (!node.id && hasExportAnonOpt) {
						optType = exportAnonType;
					}
				}

				if (!optType || options[optType] === null) {
					return;
				}

				checkBlock(node.body, options[optType], getWhitespaceBefore(node), node);
			};
		}

		function checkIfStatement(node) {
			if (options.IfStatement == null) {
				return;
			}

			const leadingWhitespace = getWhitespaceBefore(node);
			checkBlock(node.consequent, options.IfStatement, leadingWhitespace, node);
			checkBlock(node.alternate, options.IfStatement, leadingWhitespace, node);

			if (node.alternate) {
				const tokens = sourceCode.getTokensBefore(node.alternate, 2);
				checkForCuddled(
					node.alternate,
					tokens[0],
					tokens[1],
					options.IfStatement && !options.noCuddledElse && isBlock(node.consequent),
					leadingWhitespace,
				);
			}
		}

		function checkTryStatement(node) {
			if (options.TryStatement == null) {
				return;
			}

			const leadingWhitespace = getWhitespaceBefore(node);
			checkBlock(node.block, options.TryStatement, leadingWhitespace, node);

			if (node.handler) {
				checkBlock(node.handler.body, options.TryStatement, leadingWhitespace, node.handler);

				if (isBlock(node.handler.body)) {
					const previousToken = sourceCode.getTokenBefore(node.handler);
					const firstToken = sourceCode.getFirstToken(node.handler);

					checkForCuddled(
						node.handler,
						previousToken,
						firstToken,
						options.TryStatement && !options.noCuddledCatchFinally,
						leadingWhitespace,
					);
				}
			}

			if (node.finalizer) {
				checkBlock(node.finalizer, options.TryStatement, leadingWhitespace, node);

				if (isBlock(node.finalizer)) {
					const tokens = sourceCode.getTokensBefore(node.finalizer, 2);
					checkForCuddled(
						node.finalizer,
						tokens[0],
						tokens[1],
						options.TryStatement && !options.noCuddledCatchFinally,
						leadingWhitespace,
					);
				}
			}
		}

		function checkSwitchStatement(node) {
			if (options.SwitchStatement == null) {
				return;
			}

			let tokens;

			if (node.cases && node.cases.length) {
				tokens = sourceCode.getTokensBefore(node.cases[0], 2);
			} else {
				tokens = sourceCode.getLastTokens(node, 3);
			}

			const sameLine = tokens[0].loc.start.line === tokens[1].loc.start.line;
			if (options.SwitchStatement !== sameLine) {
				context.report({
					node,
					message: sameLine ? OPEN_MESSAGE_ALLMAN : OPEN_MESSAGE,
					fix: sameLine
						? insertBreakBefore(tokens[1], getWhitespaceBefore(node))
						: removeBreakBetween(tokens[0], tokens[1]),
				});
			}
		}

		return {
			ClassDeclaration: checkExportTypeDeclaration("ClassDeclaration", "ExportClass", "ExportClassAnon"),
			FunctionDeclaration: checkExportTypeDeclaration("FunctionDeclaration", "ExportFunction", "ExportFunctionAnon"),
			FunctionExpression: checkNode("FunctionExpression"),
			ArrowFunctionExpression: checkNode("ArrowFunctionExpression"),
			IfStatement: checkIfStatement,
			TryStatement: checkTryStatement,
			DoWhileStatement: checkNode("DoWhileStatement"),
			WhileStatement: checkNode("WhileStatement"),
			WithStatement: checkNode("WithStatement"),
			ForStatement: checkNode("ForStatement"),
			ForInStatement: checkNode("ForInStatement"),
			ForOfStatement: checkNode("ForOfStatement"),
			SwitchStatement: checkSwitchStatement,
		};
	},
};
