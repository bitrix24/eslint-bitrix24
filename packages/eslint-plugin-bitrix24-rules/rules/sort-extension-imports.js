module.exports = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Enforce sorted extension imports',
      category: 'Stylistic Issues',
      recommended: false,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          'newlines-between': {
            enum: ['ignore', 'always', 'always-and-inside-groups', 'never'],
          },
          'optional-newlines-for-single-imports': {
            type: 'boolean',
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const sourceCode = context.getSourceCode();
    const filename = context.getFilename();
    const options = context.options[0] || {};
    const newlinesBetween = options['newlines-between'] || 'always';
    const optionalNewlinesForSingleImports = options['optional-newlines-for-single-imports'] || false;

    function getCurrentModule(filepath) {
      const match = filepath.match(/\/([^\/]+)\/install\/js\//);
      if (match) {
        return match[1];
      }
      
      const simpleMatch = filepath.match(/^([^\/]+)\//);
      return simpleMatch ? simpleMatch[1] : null;
    }

    function getExtensionModule(importSource) {
      if (importSource.startsWith('./') || importSource.startsWith('../')) {
        return null;
      }
      if (importSource.endsWith('.css')) {
        return null;
      }
      
      const dotIndex = importSource.indexOf('.');
      if (dotIndex === -1) {
        return 'legacy';
      }
      return importSource.substring(0, dotIndex);
    }

    function getImportType(node, currentModule) {
      const importSource = node.source.value;
      
      if (node.importKind === 'type') {
        return 'type';
      }

      const hasOnlyTypeSpecifiers = node.specifiers && 
        node.specifiers.length > 0 && 
        node.specifiers.every(spec => spec.importKind === 'type');
      
      if (hasOnlyTypeSpecifiers) {
        return 'type';
      }

      if (importSource.startsWith('./') || importSource.startsWith('../')) {
        if (importSource.endsWith('.css')) {
          return 'css';
        }
        return 'local';
      }

      if (importSource.endsWith('.css')) {
        return 'css';
      }

      const module = getExtensionModule(importSource);
      
      if (module === 'main' || module === 'ui' || module === 'legacy') {
        return 'main-ui-legacy';
      }

      if (module === currentModule) {
        return 'current-module';
      }

      return 'external';
    }

    function getImportOrder(type) {
      const order = {
        'main-ui-legacy': 1,
        'external': 2,
        'current-module': 3,
        'local': 4,
        'type': 5,
        'css': 6,
      };
      return order[type] || 999;
    }

    function groupImportsBySource(imports, currentModule) {
      const groups = new Map();
      
      imports.forEach(imp => {
        const source = imp.source.value;
        
        if (!groups.has(source)) {
          groups.set(source, {
            regular: [],
            types: [],
          });
        }
        
        if (imp.importKind === 'type') {
          groups.get(source).types.push(imp);
        } else {
          groups.get(source).regular.push(imp);
        }
      });
      
      const issues = [];
      groups.forEach((group, source) => {
        if (group.regular.length > 0 && group.types.length > 0) {
          issues.push({
            source,
            regular: group.regular,
            types: group.types,
          });
        }
      });
      
      return issues;
    }

    return {
      Program(node) {
        const imports = node.body.filter(n => n.type === 'ImportDeclaration');
        if (imports.length === 0) return;

        const currentModule = getCurrentModule(filename);
        
        const sourceToImports = new Map();
        imports.forEach(imp => {
          const source = imp.source.value;
          if (!sourceToImports.has(source)) {
            sourceToImports.set(source, []);
          }
          sourceToImports.get(source).push(imp);
        });
        
        let hasStandaloneTypeImports = false;
        
        imports.forEach(imp => {
          if (imp.importKind === 'type') {
            hasStandaloneTypeImports = true;
            const source = imp.source.value;
            const sameSourceImports = sourceToImports.get(source) || [];
            const regularImport = sameSourceImports.find(i => i.importKind !== 'type');
            
            context.report({
              node: imp,
              message: `Use inline type syntax instead of 'import type'. Change to: import { type ... } from '${imp.source.value}'`,
              fix(fixer) {
                const typeSpecifiers = [];
                
                if (imp.specifiers && imp.specifiers.length > 0) {
                  imp.specifiers.forEach(spec => {
                    if (spec.type === 'ImportSpecifier') {
                      typeSpecifiers.push(`type ${sourceCode.getText(spec)}`);
                    }
                  });
                }
                
                if (regularImport) {
                  const regularText = sourceCode.getText(regularImport);
                  const importMatch = regularText.match(/^import\s+(\{[^}]*\})\s+from/);
                  if (importMatch) {
                    const existingSpecifiers = importMatch[1].slice(1, -1).trim();
                    const newSpecifiers = existingSpecifiers ? 
                      `${existingSpecifiers}, ${typeSpecifiers.join(', ')}` : 
                      typeSpecifiers.join(', ');
                    const newImport = regularText.replace(/\{[^}]*\}/, `{ ${newSpecifiers} }`);
                    
                    const prevToken = sourceCode.getTokenBefore(imp, { includeComments: true });
                    const startPos = prevToken && prevToken.loc.end.line < imp.loc.start.line 
                      ? prevToken.range[1]
                      : imp.range[0];
                    
                    return [
                      fixer.replaceText(regularImport, newImport),
                      fixer.removeRange([startPos, imp.range[1]])
                    ];
                  }
                }
                
                const newImport = `import { ${typeSpecifiers.join(', ')} } from ${sourceCode.getText(imp.source)};`;
                return fixer.replaceText(imp, newImport);
              },
            });
          }
        });
        
        if (hasStandaloneTypeImports) {
          return;
        }
        
        const mergingIssues = groupImportsBySource(imports, currentModule);
        
        if (mergingIssues.length > 0) {
          mergingIssues.forEach(issue => {
            context.report({
              node: issue.types[0],
              message: `Type imports from '${issue.source}' should be merged with regular imports using inline type syntax.`,
              fix(fixer) {
                const regularNode = issue.regular[0];
                const typeNodes = issue.types;
                
                const regularText = sourceCode.getText(regularNode);
                const typeSpecifiers = [];
                
                typeNodes.forEach(typeNode => {
                  if (typeNode.specifiers && typeNode.specifiers.length > 0) {
                    typeNode.specifiers.forEach(spec => {
                      if (spec.type === 'ImportSpecifier') {
                        typeSpecifiers.push(`type ${sourceCode.getText(spec)}`);
                      }
                    });
                  }
                });
                
                const importMatch = regularText.match(/^import\s+(\{[^}]*\})\s+from/);
                if (importMatch) {
                  const existingSpecifiers = importMatch[1].slice(1, -1).trim();
                  const newSpecifiers = existingSpecifiers ? 
                    `${existingSpecifiers}, ${typeSpecifiers.join(', ')}` : 
                    typeSpecifiers.join(', ');
                  const newImport = regularText.replace(/\{[^}]*\}/, `{ ${newSpecifiers} }`);
                  
                  const fixes = [fixer.replaceText(regularNode, newImport)];
                  
                  typeNodes.forEach((typeNode) => {
                    const prevToken = sourceCode.getTokenBefore(typeNode, { includeComments: true });
                    const startPos = prevToken && prevToken.loc.end.line < typeNode.loc.start.line 
                      ? prevToken.range[1]
                      : typeNode.range[0];
                    
                    fixes.push(fixer.removeRange([startPos, typeNode.range[1]]));
                  });
                  
                  return fixes;
                }
              },
            });
          });
          return;
        }
        
        const importGroups = imports.map(imp => {
          const type = getImportType(imp, currentModule);
          return {
            node: imp,
            type,
            order: getImportOrder(type),
            source: imp.source.value,
          };
        });

        let hasOrderIssue = false;
        for (let i = 0; i < importGroups.length - 1; i++) {
          const current = importGroups[i];
          const next = importGroups[i + 1];

          if (current.order > next.order) {
            hasOrderIssue = true;
            break;
          }
        }

        if (hasOrderIssue) {
          context.report({
            node: imports[0],
            message: 'Imports are not properly sorted.',
            fix(fixer) {
              const firstImport = imports[0];
              const lastImport = imports[imports.length - 1];
              
              const sortedGroups = [...importGroups].sort((a, b) => {
                if (a.order !== b.order) {
                  return a.order - b.order;
                }
                return a.source.localeCompare(b.source);
              });

              const grouped = {};
              sortedGroups.forEach(imp => {
                if (!grouped[imp.order]) {
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
                if (idx < orders.length - 1) {
                  newImports.push('');
                }
              });

              const range = [firstImport.range[0], lastImport.range[1]];
              return fixer.replaceTextRange(range, newImports.join('\n'));
            },
          });
          return;
        }

        if (newlinesBetween !== 'ignore') {
          const groupSizes = new Map();
          importGroups.forEach(imp => {
            const count = groupSizes.get(imp.order) || 0;
            groupSizes.set(imp.order, count + 1);
          });

          for (let i = 0; i < importGroups.length - 1; i++) {
            const current = importGroups[i];
            const next = importGroups[i + 1];

            const isDifferentGroup = current.order !== next.order;
            const linesBetween = next.node.loc.start.line - current.node.loc.end.line;
            const hasBlankLine = linesBetween > 1;

            const currentGroupSize = groupSizes.get(current.order);
            const nextGroupSize = groupSizes.get(next.order);
            const bothGroupsSingleLine = currentGroupSize === 1 && nextGroupSize === 1;
            const isOptionalNewline = optionalNewlinesForSingleImports && bothGroupsSingleLine && isDifferentGroup;

            let needsBlankLine = false;
            let shouldNotHaveBlankLine = false;

            if (newlinesBetween === 'always') {
              needsBlankLine = isDifferentGroup;
              shouldNotHaveBlankLine = !isDifferentGroup;
            } else if (newlinesBetween === 'always-and-inside-groups') {
              needsBlankLine = true;
            } else if (newlinesBetween === 'never') {
              shouldNotHaveBlankLine = true;
            }

            if (isOptionalNewline) {
              continue;
            }

            if (needsBlankLine && !hasBlankLine) {
              context.report({
                node: next.node,
                message: `Expected blank line between ${isDifferentGroup ? `'${current.type}' and '${next.type}' ` : ''}imports.`,
                fix(fixer) {
                  return fixer.insertTextAfter(current.node, '\n');
                },
              });
            } else if (shouldNotHaveBlankLine && hasBlankLine) {
              context.report({
                node: next.node,
                message: `Unexpected blank line between ${isDifferentGroup ? `'${current.type}' and '${next.type}' ` : `'${current.type}' `}imports.`,
                fix(fixer) {
                  const range = [
                    current.node.range[1],
                    next.node.range[0],
                  ];
                  return fixer.replaceTextRange(range, '\n');
                },
              });
            }
          }
        }
      },
    };
  },
};
