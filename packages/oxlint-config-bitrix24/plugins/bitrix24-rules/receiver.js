// Tells what kind of object an expression evaluates to, DOM or a custom one, for rules that
// are only about DOM nodes. Linters have no type information, so it is read from the file:
// - type annotations of parameters, variables, class properties (`this.parent`) and class
//   method return types (`this.getParent()`), TypeScript or Flow, with the file's type aliases;
// - the values written to a variable without an annotation;
// - well-known DOM sources: `window`, `document`, `document.*()`, `Dom.create()`, `Tag.render`.
// An expression the file says nothing about is UNKNOWN; rules treat it as DOM, as before.

export const UNKNOWN = 'unknown';
export const DOM = 'dom';
export const CUSTOM = 'custom';

const DOM_TYPES = new Set([
	'Node',
	'Element',
	'ParentNode',
	'ChildNode',
	'Document',
	'HTMLDocument',
	'DocumentFragment',
	'ShadowRoot',
	'Window',
	'HTMLElement',
	'SVGElement',
	'MathMLElement',
	'Text',
]);
const DOM_TYPE_PATTERN = /^(HTML|SVG|MathML)\w*Element$/;

// Types that say nothing about the object
const VAGUE_TYPES = new Set(['any', 'mixed', 'unknown', 'Object', 'object', 'Function', 'EventTarget']);

// Globals that are DOM objects unless the file declares a variable of the same name
const DOM_GLOBALS = new Set(['window', 'document', 'self', 'globalThis', 'top', 'parent']);

// Methods returning a DOM element
const DOM_QUERIES = new Set(['querySelector', 'getElementById', 'closest', 'createElement', 'createTextNode', 'createDocumentFragment', 'createElementNS']);

export const PROPERTY_TYPES = new Set(['PropertyDefinition', 'ClassProperty', 'ClassPrivateProperty', 'TSAbstractPropertyDefinition']);
export const METHOD_TYPES = new Set(['MethodDefinition', 'ClassMethod', 'ClassPrivateMethod', 'TSAbstractMethodDefinition']);

export function isDomTypeName(name)
{
	return DOM_TYPES.has(name) || DOM_TYPE_PATTERN.test(name);
}

function combine(kinds)
{
	if (kinds.includes(DOM))
	{
		return DOM;
	}

	return kinds.length > 0 && kinds.every((kind) => kind === CUSTOM) ? CUSTOM : UNKNOWN;
}

/**
 * The kind of a type annotation: DOM, custom or unknown.
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
			return combine(type.types.map((member) => classifyType(member, aliases, seen)).filter((kind) => kind !== UNKNOWN));

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
			if (isDomTypeName(name))
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

		// null, void, keywords and literals say nothing
		default:
			return UNKNOWN;
	}
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

export function enclosingClass(node)
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

export function nameOf(key)
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

export function findClassMember(classBody, name, types)
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

function isMember(node, objectName, propertyName)
{
	return node.type === 'MemberExpression'
		&& !node.computed
		&& node.object.type === 'Identifier'
		&& node.object.name === objectName
		&& node.property.name === propertyName;
}

function isNullish(node)
{
	return (node.type === 'Literal' && node.value === null) || (node.type === 'Identifier' && node.name === 'undefined');
}

/**
 * @returns {(node: object) => 'dom' | 'custom' | 'unknown'}
 */
export function createReceiverClassifier(context)
{
	const sourceCode = context.sourceCode ?? context.getSourceCode();
	let aliases = null;

	// type aliases of the file: `type Container = HTMLElement`
	const getAliases = () => {
		if (!aliases)
		{
			aliases = new Map();
			for (const statement of sourceCode.ast.body)
			{
				const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;
				if (declaration?.type === 'TypeAlias' || declaration?.type === 'TSTypeAliasDeclaration')
				{
					aliases.set(declaration.id.name, declaration.right ?? declaration.typeAnnotation);
				}
			}
		}

		return aliases;
	};

	const typeKind = (annotation) => classifyType(annotation, getAliases());
	const variableOf = (node) => findVariable(sourceCode.getScope(node), node.name);

	// the values written to a variable: its initializer and assignments, without null and undefined
	const valuesOf = (variable) => {
		const written = variable.references.map((reference) => reference.writeExpr).filter(Boolean);
		const init = variable.defs?.[0]?.node?.init;
		const values = written.length > 0 || !init ? written : [init];

		return values.filter((value) => !isNullish(value));
	};

	const classify = (node, seen = new Set()) => {
		switch (node?.type)
		{
			case 'Identifier':
			{
				const variable = variableOf(node);
				const definition = variable?.defs?.[0];
				if (!definition)
				{
					return DOM_GLOBALS.has(node.name) ? DOM : UNKNOWN;
				}

				let declared = definition.name;
				// a parameter with a default value: `node: BBCodeNode = null`
				if (declared && !declared.typeAnnotation && declared.parent?.type === 'AssignmentPattern')
				{
					declared = declared.parent.left;
				}

				if (declared?.typeAnnotation)
				{
					return typeKind(declared.typeAnnotation);
				}

				// parameters and imports have no values to look at
				if (definition.type !== 'Variable' || seen.has(variable))
				{
					return UNKNOWN;
				}

				seen.add(variable);

				return combine(valuesOf(variable).map((value) => classify(value, seen)));
			}

			case 'TSAsExpression':
			case 'TypeCastExpression':
				return typeKind(node.typeAnnotation);

			case 'TSNonNullExpression':
			case 'ChainExpression':
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
					const element = elementType(variable?.defs?.[0]?.name?.typeAnnotation);
					if (element)
					{
						return typeKind(element);
					}

					if (!variable || variable.defs[0]?.type !== 'Variable' || seen.has(variable))
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

				// `document.body`, `window.parent`
				if (node.object.type === 'Identifier' && !variableOf(node.object) && DOM_GLOBALS.has(node.object.name))
				{
					return DOM;
				}

				const member = thisMember(node);
				const property = member && findClassMember(member.classBody, member.name, PROPERTY_TYPES);

				return typeKind(property?.typeAnnotation);
			}

			case 'NewExpression':
			{
				const name = node.callee.type === 'Identifier' ? node.callee.name : null;
				if (!name)
				{
					return UNKNOWN;
				}

				return isDomTypeName(name) ? DOM : CUSTOM;
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

				if (isMember(callee, 'Dom', 'create') || isMember(callee, 'Tag', 'render'))
				{
					return DOM;
				}

				const method = callee.property.name;
				if (DOM_QUERIES.has(method) && classify(callee.object, seen) === DOM)
				{
					return DOM;
				}

				const member = thisMember(callee);
				if (member)
				{
					const definition = findClassMember(member.classBody, member.name, METHOD_TYPES);

					return typeKind(definition?.value?.returnType ?? definition?.returnType);
				}

				// a factory of a custom object: `scheme.createElement()`
				if (/^create[A-Z]/.test(method) && classify(callee.object, seen) === CUSTOM)
				{
					return CUSTOM;
				}

				return UNKNOWN;
			}

			default:
				return UNKNOWN;
		}
	};

	return (node) => classify(node);
}
