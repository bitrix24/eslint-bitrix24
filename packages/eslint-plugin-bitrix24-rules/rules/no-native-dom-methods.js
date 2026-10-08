// Native DOM methods that change the children of a node. Custom trees (BBCode nodes,
// models) often have methods of the same names, so a call is reported only when the
// object may be a DOM node: its type annotation or the values written to it say so, or
// nothing says otherwise.
// method -> number of arguments of the native one, null for any
const METHODS = new Map([['appendChild', 1], ['removeChild', 1], ['replaceChild', 2], ['insertBefore', 2], ['replaceChildren', null]]);

const DOM_TYPES = new Set([
	'Node',
	'Element',
	'ParentNode',
	'ChildNode',
	'Document',
	'DocumentFragment',
	'ShadowRoot',
	'HTMLElement',
	'SVGElement',
	'MathMLElement',
]);
const DOM_TYPE_PATTERN = /^(HTML|SVG|MathML)\w*Element$/;

// Types that say nothing about the object
const VAGUE_TYPES = new Set(['any', 'mixed', 'unknown', 'Object', 'object', 'Function']);

const UNKNOWN = 'unknown';
const DOM = 'dom';
const CUSTOM = 'custom';

function combine(kinds)
{
	if (kinds.includes(DOM))
	{
		return DOM;
	}

	return kinds.length > 0 && kinds.every((kind) => kind === CUSTOM) ? CUSTOM : UNKNOWN;
}

// `Array<T>` or `T[]` -> `T`
function elementType(type)
{
	const annotation = type?.typeAnnotation ?? type;
	switch (annotation?.type)
	{
		case 'TypeAnnotation':
		case 'TSTypeAnnotation':
		case 'NullableTypeAnnotation':
			return elementType(annotation.typeAnnotation);
		case 'ArrayTypeAnnotation':
		case 'TSArrayType':
			return annotation.elementType;
		case 'GenericTypeAnnotation':
		case 'TSTypeReference':
		{
			const name = (annotation.id ?? annotation.typeName)?.name;
			const params = (annotation.typeParameters ?? annotation.typeArguments)?.params;

			return name === 'Array' ? params?.[0] ?? null : null;
		}
		default:
			return null;
	}
}

// `document.createElement()`, `this.ownerDocument.createTextNode()`
function isDocument(node)
{
	return (node.type === 'Identifier' && /document$/i.test(node.name))
		|| (node.type === 'MemberExpression' && !node.computed && /document$/i.test(node.property.name ?? ''));
}

function isMember(node, objectName, propertyName)
{
	return node.type === 'MemberExpression'
		&& !node.computed
		&& node.object.type === 'Identifier'
		&& node.object.name === objectName
		&& node.property.name === propertyName;
}

const PROPERTY_TYPES = new Set(['PropertyDefinition', 'ClassProperty', 'ClassPrivateProperty', 'TSAbstractPropertyDefinition']);
const METHOD_TYPES = new Set(['MethodDefinition', 'ClassMethod', 'ClassPrivateMethod', 'TSAbstractMethodDefinition']);

/**
 * The kind of a type annotation, Flow (Babel) or TypeScript: DOM, custom or unknown.
 */
function classifyType(type, aliases, seen = new Set())
{
	switch (type?.type)
	{
		case 'TypeAnnotation':
		case 'TSTypeAnnotation':
		case 'NullableTypeAnnotation':
		case 'TSParenthesizedType':
			return classifyType(type.typeAnnotation, aliases, seen);

		case 'UnionTypeAnnotation':
		case 'TSUnionType':
		case 'IntersectionTypeAnnotation':
		case 'TSIntersectionType':
		{
			const kinds = type.types.map((member) => classifyType(member, aliases, seen));
			if (kinds.includes(DOM))
			{
				return DOM;
			}

			return kinds.includes(CUSTOM) ? CUSTOM : UNKNOWN;
		}

		case 'GenericTypeAnnotation':
		case 'TSTypeReference':
		{
			// `Foo.Bar` is not resolved
			const id = type.id ?? type.typeName;
			if (id?.type !== 'Identifier')
			{
				return UNKNOWN;
			}

			const name = id.name;
			if (DOM_TYPES.has(name) || DOM_TYPE_PATTERN.test(name))
			{
				return DOM;
			}

			if (VAGUE_TYPES.has(name))
			{
				return UNKNOWN;
			}

			if (aliases.has(name) && !seen.has(name))
			{
				seen.add(name);

				return classifyType(aliases.get(name), aliases, seen);
			}

			return CUSTOM;
		}

		// null, void, literals and keywords say nothing
		default:
			return UNKNOWN;
	}
}

function findVariable(scope, name)
{
	for (let current = scope; current; current = current.upper)
	{
		const variable = current.set?.get(name);
		if (variable)
		{
			return variable;
		}
	}

	return null;
}

function enclosingClass(node)
{
	for (let current = node.parent; current; current = current.parent)
	{
		if (current.type === 'ClassBody')
		{
			return current;
		}
	}

	return null;
}

function nameOf(key)
{
	switch (key?.type)
	{
		case 'Identifier':
			return key.name;
		case 'PrivateIdentifier':
			return `#${key.name}`;
		case 'PrivateName':
			return `#${key.id.name}`;
		default:
			return null;
	}
}

function findClassMember(classBody, name, types)
{
	return classBody.body.find((member) => types.has(member.type) && !member.computed && nameOf(member.key) === name) ?? null;
}

// `this.name` or `this.#name` in a class body
function thisMember(node)
{
	if (node.type !== 'MemberExpression' || node.computed || node.object.type !== 'ThisExpression')
	{
		return null;
	}

	const classBody = enclosingClass(node);
	const name = nameOf(node.property);

	return classBody && name ? { classBody, name } : null;
}

export default {
	meta: {
		type: "problem",
		schema: [],
		fixable: null,
		messages: {
			moduleError: "Use `Dom` functions from `main.core` to manipulate element's children",
			scriptError: "Use `BX.Dom` functions from `main.core` to manipulate element's children",
		},
	},
	create(context) {
		const sourceCode = context.sourceCode ?? context.getSourceCode();
		let sourceType = "module";
		// type aliases of the file: `type Container = HTMLElement`
		const aliases = new Map();

		const variableOf = (node) => findVariable(sourceCode.getScope(node), node.name);

		// the values written to a variable: its initializer and assignments, except `null`
		// and `undefined`, which say nothing about the object
		const valuesOf = (variable) => {
			const written = variable.references.map((reference) => reference.writeExpr).filter(Boolean);
			const init = variable.defs?.[0]?.node?.init;
			const values = written.length > 0 || !init ? written : [init];

			return values.filter((value) => !(value.type === 'Literal' && value.value === null) && !(value.type === 'Identifier' && value.name === 'undefined'));
		};

		/**
		 * The kind of object an expression evaluates to, as the type annotations of the file
		 * declare it or the values written to a variable show it.
		 */
		const classify = (node, seen = new Set()) => {
			switch (node?.type)
			{
				case 'Identifier':
				{
					const variable = variableOf(node);
					const definition = variable?.defs?.[0];
					let declared = definition?.name;
					// a parameter with a default value: `node: BBCodeNode = null`
					if (declared && !declared.typeAnnotation && declared.parent?.type === 'AssignmentPattern')
					{
						declared = declared.parent.left;
					}

					if (declared?.typeAnnotation)
					{
						return classifyType(declared.typeAnnotation, aliases);
					}

					// parameters and imports have no values to look at
					if (!variable || definition.type !== 'Variable' || seen.has(variable))
					{
						return UNKNOWN;
					}

					seen.add(variable);

					return combine(valuesOf(variable).map((value) => classify(value, seen)));
				}

				case 'TSAsExpression':
				case 'TypeCastExpression':
					return classifyType(node.typeAnnotation, aliases);

				case 'TSNonNullExpression':
					return classify(node.expression, seen);

				case 'MemberExpression':
				{
					// an element of an array: `stack[level]`
					if (node.computed)
					{
						if (node.object.type !== 'Identifier')
						{
							return UNKNOWN;
						}

						const variable = variableOf(node.object);
						const declared = variable?.defs?.[0]?.name;
						const element = elementType(declared?.typeAnnotation);
						if (element)
						{
							return classifyType(element, aliases);
						}

						if (!variable || variable.defs[0].type !== 'Variable' || seen.has(variable))
						{
							return UNKNOWN;
						}

						seen.add(variable);
						const arrays = valuesOf(variable);
						if (arrays.length === 0 || arrays.some((value) => value.type !== 'ArrayExpression'))
						{
							return UNKNOWN;
						}

						return combine(arrays.flatMap((array) => array.elements).filter(Boolean).map((value) => classify(value, seen)));
					}

					const member = thisMember(node);
					const property = member && findClassMember(member.classBody, member.name, PROPERTY_TYPES);

					return classifyType(property?.typeAnnotation, aliases);
				}

				case 'NewExpression':
				{
					const name = node.callee.type === 'Identifier' ? node.callee.name : null;
					if (!name)
					{
						return UNKNOWN;
					}

					return DOM_TYPES.has(name) || DOM_TYPE_PATTERN.test(name) || name === 'Text' ? DOM : CUSTOM;
				}

				case 'TaggedTemplateExpression':
					return isMember(node.tag, 'Tag', 'render') ? DOM : UNKNOWN;

				case 'CallExpression':
				{
					const callee = node.callee;
					if (callee.type !== 'MemberExpression' || callee.computed)
					{
						return UNKNOWN;
					}

					if (isDocument(callee.object) || isMember(callee, 'Dom', 'create') || isMember(callee, 'Tag', 'render'))
					{
						return DOM;
					}

					const member = thisMember(callee);
					if (member)
					{
						const method = findClassMember(member.classBody, member.name, METHOD_TYPES);

						return classifyType(method?.value?.returnType ?? method?.returnType, aliases);
					}

					// a factory of a custom object: `scheme.createElement()`
					if (/^create[A-Z]/.test(callee.property.name) && classify(callee.object, seen) === CUSTOM)
					{
						return CUSTOM;
					}

					return UNKNOWN;
				}

				default:
					return UNKNOWN;
			}
		};

		return {
			Program(node) {
				sourceType = node.sourceType;
				for (const statement of node.body)
				{
					const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
					if (declaration?.type === 'TypeAlias' || declaration?.type === 'TSTypeAliasDeclaration')
					{
						aliases.set(declaration.id.name, declaration.right ?? declaration.typeAnnotation);
					}
				}
			},
			CallExpression(node) {
				const callee = node.callee;
				if (
					callee.type !== 'MemberExpression'
					|| callee.computed
					|| !METHODS.has(callee.property.name)
					|| callee.object.name === 'Dom'
				)
				{
					return;
				}

				// not the native signature: `parent.replaceChild(this, ...children)`
				const args = node.arguments;
				const arity = METHODS.get(callee.property.name);
				if (arity !== null && (args.length !== arity || args.some((arg) => arg.type === 'SpreadElement')))
				{
					return;
				}

				// a tree of its own: `this.appendChild()` in a class that declares `appendChild`
				const classBody = callee.object.type === 'ThisExpression' ? enclosingClass(node) : null;
				if (classBody && findClassMember(classBody, callee.property.name, METHOD_TYPES))
				{
					return;
				}

				if (classify(callee.object) === CUSTOM)
				{
					return;
				}

				context.report({
					node: callee.property,
					messageId: `${sourceType}Error`,
				});
			},
		};
	},
};
