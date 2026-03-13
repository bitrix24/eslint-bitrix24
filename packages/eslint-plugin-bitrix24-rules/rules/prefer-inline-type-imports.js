module.exports = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Enforce inline type syntax (import { type T }) instead of import type',
			category: 'Stylistic Issues',
			recommended: true
		},
		fixable: 'code',
		schema: []
	},

	create(context)
	{
		const sourceCode = context.sourceCode || context.getSourceCode();

		function isIgnoredTypeImport(imp)
		{
			if (imp.importKind !== 'type')
			{
				return false;
			}

			const hasDefaultSpecifier = imp.specifiers.some(s => s.type === 'ImportDefaultSpecifier');
			const hasNamespaceSpecifier = imp.specifiers.some(s => s.type === 'ImportNamespaceSpecifier');
			return hasDefaultSpecifier || hasNamespaceSpecifier;
		}

		function isInlineTypeOnlyImport(imp)
		{
			if (imp.importKind === 'type')
			{
				return false;
			}

			const hasDefaultSpecifier = imp.specifiers.some(s => s.type === 'ImportDefaultSpecifier');
			const hasNamespaceSpecifier = imp.specifiers.some(s => s.type === 'ImportNamespaceSpecifier');
			if (hasDefaultSpecifier || hasNamespaceSpecifier)
			{
				return false;
			}

			const importSpecifiers = imp.specifiers.filter(s => s.type === 'ImportSpecifier');
			if (importSpecifiers.length === 0)
			{
				return false;
			}

			return importSpecifiers.every(spec => spec.importKind === 'type');
		}

		function getTypeSpecifierText(spec)
		{
			if (spec.importKind === 'type')
			{
				return sourceCode.getText(spec);
			}

			return `type ${sourceCode.getText(spec)}`;
		}

		function groupImportsBySource(imports)
		{
			const groups = new Map();

			imports.forEach(imp => {
				const source = imp.source.value;

				if (!groups.has(source))
				{
					groups.set(source, {
						regular: [],
						types: []
					});
				}

				if (imp.importKind === 'type')
				{
					if (!isIgnoredTypeImport(imp))
					{
						groups.get(source).types.push(imp);
					}
				}
				else if (isInlineTypeOnlyImport(imp))
				{
					groups.get(source).types.push(imp);
				}
				else
				{
					groups.get(source).regular.push(imp);
				}
			});

			const issues = [];
			groups.forEach((group, source) => {
				if (group.regular.length > 0 && group.types.length > 0)
				{
					issues.push({
						source,
						regular: group.regular,
						types: group.types
					});
				}
			});

			return issues;
		}

		return {
			Program(node)
			{
				const imports = node.body.filter(n => n.type === 'ImportDeclaration');
				if (imports.length === 0)
				{
					return;
				}

				const sourceToImports = new Map();
				imports.forEach(imp => {
					const source = imp.source.value;
					if (!sourceToImports.has(source))
					{
						sourceToImports.set(source, []);
					}
					sourceToImports.get(source).push(imp);
				});

				let hasStandaloneTypeImports = false;

				// Check for standalone import type
				imports.forEach(imp => {
					if (imp.importKind === 'type')
					{
						// Ignore if it has a default or namespace specifier (e.g. import type Default from 'main.core')
						if (isIgnoredTypeImport(imp))
						{
							return;
						}

						hasStandaloneTypeImports = true;
						const source = imp.source.value;
						const sameSourceImports = sourceToImports.get(source) || [];
						const regularImport = sameSourceImports.find(i => i.importKind !== 'type' && !isInlineTypeOnlyImport(i));

						context.report({
							node: imp,
							message: `Use inline type syntax instead of 'import type'. Change to: import { type ... } from '${imp.source.value}'`,
							fix(fixer)
							{
								const typeSpecifiers = [];

								if (imp.specifiers && imp.specifiers.length > 0)
								{
									imp.specifiers.forEach(spec => {
										if (spec.type === 'ImportSpecifier')
										{
											typeSpecifiers.push(getTypeSpecifierText(spec));
										}
									});
								}

								if (regularImport)
								{
									const importSpecifiers = regularImport.specifiers.filter(s => s.type === 'ImportSpecifier');
									const defaultSpecifier = regularImport.specifiers.find(s => s.type === 'ImportDefaultSpecifier');
									const hasNamespaceSpecifier = regularImport.specifiers.some(s => s.type === 'ImportNamespaceSpecifier');

									if (!hasNamespaceSpecifier && importSpecifiers.length > 0)
									{
										// Case: import D, { A } from 'main.core' OR import { A } from 'main.core'
										const tokens = sourceCode.getTokens(regularImport);
										const closingBrace = tokens.filter(t => t.value === '}').pop();

										if (closingBrace)
										{
											const prevToken = sourceCode.getTokenBefore(closingBrace);
											let insertText = '';
											let insertNode = prevToken;

											if (prevToken.value === ',')
											{
												insertText = ' ' + typeSpecifiers.join(', ');
											}
											else
											{
												insertText = ', ' + typeSpecifiers.join(', ');
											}

											const prevTokenImp = sourceCode.getTokenBefore(imp, { includeComments: true });
											const startPos = prevTokenImp && prevTokenImp.loc.end.line < imp.loc.start.line
												? prevTokenImp.range[1]
												: imp.range[0];

											return [
												fixer.insertTextAfter(insertNode, insertText),
												fixer.removeRange([startPos, imp.range[1]])
											];
										}
									}
									else if (!hasNamespaceSpecifier && defaultSpecifier)
									{
										// Case: import D from 'main.core'
										// We need to convert it to: import D, { type ... } from 'main.core'
										const insertText = `, { ${typeSpecifiers.join(', ')} }`;

										const prevTokenImp = sourceCode.getTokenBefore(imp, { includeComments: true });
										const startPos = prevTokenImp && prevTokenImp.loc.end.line < imp.loc.start.line
											? prevTokenImp.range[1]
											: imp.range[0];

										return [
											fixer.insertTextAfter(defaultSpecifier, insertText),
											fixer.removeRange([startPos, imp.range[1]])
										];
									}
								}

								if (typeSpecifiers.length === 0)
								{
									return null;
								}

								const newImport = `import { ${typeSpecifiers.join(', ')} } from ${sourceCode.getText(imp.source)};`;
								return fixer.replaceText(imp, newImport);
							}
						});
					}
				});

				if (hasStandaloneTypeImports)
				{
					return;
				}

				// Check for imports with inline type specifiers that should be merged
				const mergingIssues = groupImportsBySource(imports);

				if (mergingIssues.length > 0)
				{
					mergingIssues.forEach(issue => {
						context.report({
							node: issue.types[0],
							message: `Use inline type syntax to merge type imports from '${issue.source}' with regular imports.`,
							fix(fixer)
							{
								const regularNode = issue.regular[0];
								const typeNodes = issue.types;

								const typeSpecifiers = [];

								typeNodes.forEach(typeNode => {
									if (typeNode.specifiers && typeNode.specifiers.length > 0)
									{
										typeNode.specifiers.forEach(spec => {
											if (spec.type === 'ImportSpecifier')
											{
												typeSpecifiers.push(getTypeSpecifierText(spec));
											}
										});
									}
								});

								if (typeSpecifiers.length === 0)
								{
									return null;
								}

								const importSpecifiers = regularNode.specifiers.filter(s => s.type === 'ImportSpecifier');
								const defaultSpecifier = regularNode.specifiers.find(s => s.type === 'ImportDefaultSpecifier');
								const hasNamespaceSpecifier = regularNode.specifiers.some(s => s.type === 'ImportNamespaceSpecifier');

								const fixes = [];

								if (hasNamespaceSpecifier)
								{
									return null;
								}

								if (importSpecifiers.length > 0)
								{
									// Find the closing brace '}' of the import statement
									const tokens = sourceCode.getTokens(regularNode);
									const closingBrace = tokens.filter(t => t.value === '}').pop();

									if (closingBrace)
									{
										const prevToken = sourceCode.getTokenBefore(closingBrace);
										let insertText = '';
										let insertNode = prevToken;

										if (prevToken.value === ',')
										{
											insertText = ' ' + typeSpecifiers.join(', ');
										}
										else
										{
											insertText = ', ' + typeSpecifiers.join(', ');
										}

										fixes.push(fixer.insertTextAfter(insertNode, insertText));
									}
								}
								else if (defaultSpecifier)
								{
									// Case: import D from 'main.core'
									// Convert to: import D, { type ... } from 'main.core'
									const insertText = `, { ${typeSpecifiers.join(', ')} }`;
									fixes.push(fixer.insertTextAfter(defaultSpecifier, insertText));
								}
								else
								{
									// No specifiers? (e.g. import 'main.core') - unlikely to merge but possible technically if allow side-effects
									return null;
								}

								if (fixes.length > 0)
								{
									typeNodes.forEach((typeNode) => {
										const prevToken = sourceCode.getTokenBefore(typeNode, { includeComments: true });
										const startPos = prevToken && prevToken.loc.end.line < typeNode.loc.start.line
											? prevToken.range[1]
											: typeNode.range[0];

										fixes.push(fixer.removeRange([startPos, typeNode.range[1]]));
									});
									return fixes;
								}

								return null;
							}
						});
					});
				}
			}
		};
	}
};
