module.exports = {
	meta: {
		type: 'layout',
		docs: {
			description: 'Enforce sorted extension imports',
			category: 'Stylistic Issues',
			recommended: false
		},
		fixable: 'code',
		schema: []
	},

	create(context)
	{
		const sourceCode = context.getSourceCode();
		const filename = context.getFilename();
		function getCurrentModule(filepath)
		{
			const match = filepath.match(/\/([^\/]+)\/install\/js\//);
			if (match)
			{
				return match[1];
			}

			const simpleMatch = filepath.match(/^([^\/]+)\//);
			return simpleMatch ? simpleMatch[1] : null;
		}

		function getExtensionModule(importSource)
		{
			if (importSource.startsWith('./') || importSource.startsWith('../'))
			{
				return null;
			}
			if (importSource.endsWith('.css'))
			{
				return null;
			}

			const dotIndex = importSource.indexOf('.');
			if (dotIndex === -1)
			{
				return 'legacy';
			}
			return importSource.substring(0, dotIndex);
		}

		function getImportType(node, currentModule)
		{
			const importSource = node.source.value;

			// Check for CSS imports first
			if (importSource.endsWith('.css'))
			{
				return 'css';
			}

			// Check for local imports (relative paths)
			if (importSource.startsWith('./') || importSource.startsWith('../'))
			{
				return 'local';
			}

			const module = getExtensionModule(importSource);

			// main, ui, legacy extensions (including type-only imports)
			if (module === 'main' || module === 'ui' || module === 'legacy')
			{
				return 'main-ui-legacy';
			}

			// Current module imports (including type-only imports)
			if (module === currentModule)
			{
				return 'current-module';
			}

			// External modules (including type-only imports)
			return 'external';
		}

		function getImportOrder(type)
		{
			const order = {
				'main-ui-legacy': 1,
				'external': 2,
				'current-module': 3,
				'local': 4,
				'css': 5
			};
			return order[type] || 999;
		}

		return {
			Program(node)
			{
				const imports = node.body.filter(n => n.type === 'ImportDeclaration');
				if (imports.length === 0)
				{
					return;
				}

				const currentModule = getCurrentModule(filename);

				const importGroups = imports.map(imp => {
					const type = getImportType(imp, currentModule);
					return {
						node: imp,
						type,
						order: getImportOrder(type),
						source: imp.source.value
					};
				});

				let hasOrderIssue = false;
				for (let i = 0; i < importGroups.length - 1; i++)
				{
					const current = importGroups[i];
					const next = importGroups[i + 1];

					if (current.order > next.order)
					{
						hasOrderIssue = true;
						break;
					}
				}

				if (hasOrderIssue)
				{
					context.report({
						node: imports[0],
						message: 'Imports are not properly sorted.',
						fix(fixer)
						{
							const firstImport = imports[0];
							const lastImport = imports[imports.length - 1];

							const sortedGroups = [...importGroups].sort((a, b) => {
								if (a.order !== b.order)
								{
									return a.order - b.order;
								}
								return a.source.localeCompare(b.source);
							});

							const grouped = {};
							sortedGroups.forEach(imp => {
								if (!grouped[imp.order])
								{
									grouped[imp.order] = [];
								}
								grouped[imp.order].push(imp.node);
							});

							const newImports = [];
							const orders = Object.keys(grouped).sort((a, b) => a - b);

							orders.forEach((order, idx) => {
								grouped[order].forEach(node => {
									newImports.push(sourceCode.getText(node));
								});
								if (idx < orders.length - 1)
								{
									newImports.push('');
								}
							});

							const range = [firstImport.range[0], lastImport.range[1]];
							return fixer.replaceTextRange(range, newImports.join('\n'));
						}
					});
					return;
				}

				const groupSizes = new Map();
				importGroups.forEach(imp => {
					const count = groupSizes.get(imp.order) || 0;
					groupSizes.set(imp.order, count + 1);
				});

				for (let i = 0; i < importGroups.length - 1; i++)
				{
					const current = importGroups[i];
					const next = importGroups[i + 1];

					const isDifferentGroup = current.order !== next.order;
					const linesBetween = next.node.loc.start.line - current.node.loc.end.line;
					const hasBlankLine = linesBetween > 1;

					const currentGroupSize = groupSizes.get(current.order);
					const nextGroupSize = groupSizes.get(next.order);
					const hasSingleLineGroup = currentGroupSize === 1 || nextGroupSize === 1;
					const isOptionalNewline = hasSingleLineGroup && isDifferentGroup;

					let needsBlankLine = false;

					if (isDifferentGroup)
					{
						// Between groups: blank line is required
						needsBlankLine = true;
					}

					if (isOptionalNewline)
					{
						continue;
					}

					if (needsBlankLine && !hasBlankLine)
					{
						context.report({
							node: next.node,
							message: `Expected blank line between '${current.type}' and '${next.type}' imports.`,
							fix(fixer)
							{
								return fixer.insertTextAfter(current.node, '\n');
							}
						});
					}
				}
			}
		};
	}
};
