// eslint-plugin-vue checks only the objects it recognizes as components: arguments of
// Vue.component() and defineComponent() imported from 'vue', `export default` in .vue files,
// and objects with a `// @vue/component` comment on the line above. Bitrix24 declares
// components in .js and .ts files many other ways: plain `const X = {...}`,
// `BitrixVue.localComponent()`, `defineComponent()` and `createApp()` from 'ui.vue3', and so on.
//
// `withComponentMarks` hands the vue rules a source code whose comments also include
// `@vue/component` above every object that is a component by its shape or by the factory
// it is passed to, so the rules check these components too. The file itself is not changed.

// Calls whose object argument is a component: BitrixVue.component(), defineComponent(), ...;
const FACTORIES = new Set([
	'component',
	'localComponent',
	'mutableComponent',
	'cloneComponent',
	'defineComponent',
	'createApp',
	'createVue',
]);
// not `extend`: tiptap extensions are made with Node.extend({...}), Vue.extend() is caught by the
// shape of its argument

// Options only a component has; `data`, `render` and `template` are too common words to tell
// a component on their own
const COMPONENT_OPTIONS = new Set([
	'props',
	'setup',
	'computed',
	'methods',
	'watch',
	'components',
	'directives',
	'emits',
	'expose',
	'inject',
	'provide',
	'mixins',
	'beforeCreate',
	'created',
	'beforeMount',
	'mounted',
	'beforeUpdate',
	'updated',
	'beforeUnmount',
	'unmounted',
	'beforeDestroy',
	'destroyed',
	'activated',
	'deactivated',
]);

function keyName(property)
{
	if (property.type !== 'Property' || property.computed)
	{
		return null;
	}

	return property.key.type === 'Identifier' ? property.key.name : property.key.value;
}

function calleeName(call)
{
	const callee = call.callee;
	if (callee.type === 'Identifier')
	{
		return callee.name;
	}

	return callee.type === 'MemberExpression' && !callee.computed ? callee.property.name : null;
}

/**
 * A component by its shape:
 * - a template with markup: `template: '<div>...</div>'`;
 * - a template, render function or data with a component option (`props`, `methods`, `setup`, a
 *   lifecycle hook, ...);
 * - props with methods, computed, setup or watch.
 */
function hasComponentShape(object)
{
	const values = new Map();
	for (const property of object.properties)
	{
		const name = keyName(property);
		if (name !== null)
		{
			values.set(name, property.value);
		}
	}

	const template = values.get('template');
	const markup = template?.type === 'Literal' ? template.value : template?.type === 'TemplateLiteral' ? template.quasis[0]?.value.raw : null;
	if (typeof markup === 'string' && markup.trimStart().startsWith('<'))
	{
		return true;
	}

	const options = [...values.keys()].filter((name) => COMPONENT_OPTIONS.has(name));
	if ((values.has('template') || values.has('render') || values.has('data')) && options.length > 0)
	{
		return true;
	}

	return values.has('props') && options.length > 1;
}

function findComponents(ast)
{
	const components = [];
	const stack = [[ast, null]];
	while (stack.length > 0)
	{
		const [node, parent] = stack.pop();
		if (Array.isArray(node))
		{
			for (const item of node)
			{
				stack.push([item, parent]);
			}

			continue;
		}

		if (!node || typeof node.type !== 'string')
		{
			continue;
		}

		if (node.type === 'ObjectExpression')
		{
			const factory = parent?.type === 'CallExpression' && parent.arguments.includes(node) && FACTORIES.has(calleeName(parent));
			if (factory || hasComponentShape(node))
			{
				components.push(node);
			}
		}

		for (const key of Object.keys(node))
		{
			const value = node[key];
			if (key !== 'parent' && value && typeof value === 'object')
			{
				stack.push([value, node]);
			}
		}
	}

	return components;
}

const marksByAst = new WeakMap();

// `// @vue/component` comments, one on the line above each component
function componentMarks(sourceCode)
{
	let marks = marksByAst.get(sourceCode.ast);
	if (!marks)
	{
		marks = findComponents(sourceCode.ast).map((node) => {
			const line = node.loc.start.line - 1;
			const position = { line, column: 0 };

			return {
				type: 'Line',
				value: ' @vue/component',
				range: [node.range[0], node.range[0]],
				start: node.range[0],
				end: node.range[0],
				loc: { start: position, end: position },
			};
		});
		marksByAst.set(sourceCode.ast, marks);
	}

	return marks;
}

function bindTo(target)
{
	const bound = new Map();

	return (property) => {
		const value = Reflect.get(target, property, target);
		if (typeof value !== 'function')
		{
			return value;
		}

		if (!bound.has(property))
		{
			bound.set(property, value.bind(target));
		}

		return bound.get(property);
	};
}

function markedSourceCode(sourceCode)
{
	const read = bindTo(sourceCode);
	const getAllComments = () => [...sourceCode.getAllComments(), ...componentMarks(sourceCode)];

	return new Proxy({}, {
		get: (target, property) => (property === 'getAllComments' ? getAllComments : read(property)),
		has: (target, property) => Reflect.has(sourceCode, property),
	});
}

function markedContext(context)
{
	const read = bindTo(context);
	let sourceCode = null;
	const getSourceCode = () => {
		sourceCode ??= markedSourceCode(context.sourceCode);

		return sourceCode;
	};

	return new Proxy({}, {
		get: (target, property) => {
			if (property === 'sourceCode')
			{
				return getSourceCode();
			}

			if (property === 'getSourceCode')
			{
				return getSourceCode;
			}

			return read(property);
		},
		has: (target, property) => Reflect.has(context, property),
	});
}

/**
 * @param {{ meta?: object, rules: Record<string, object> }} plugin
 */
export function withComponentMarks(plugin)
{
	return {
		...plugin,
		rules: Object.fromEntries(Object.entries(plugin.rules).map(([name, rule]) => [name, {
			...rule,
			create: (context) => rule.create(markedContext(context)),
		}])),
	};
}
