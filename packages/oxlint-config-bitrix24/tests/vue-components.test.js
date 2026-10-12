import { RuleTester } from 'oxlint/plugins-dev';
import vue from '../dist/vue.js';

// The bundled vue rules recognize the components of .js and .ts files by their shape and by
// the factory they are passed to, not only by a `// @vue/component` comment.
const ruleTester = new RuleTester();
const dupe = { messageId: 'duplicateKey' };
const component = (declaration) => `import { BitrixVue, defineComponent, createApp } from 'ui.vue3';\n${declaration}`;
const body = "{\n\tname: 'Counter',\n\ttemplate: '<div></div>',\n\tdata() { return { count: 0 }; },\n\tmethods: { count() {} },\n}";

ruleTester.run('vue-components', vue.rules['no-dupe-keys'], {
	// objects that would be reported if they were taken for components: `a` is in data and in
	// the props
	valid: [
		"export const column = { id: 'title', data() { return { a: 1 }; }, render: (row) => row.title, a: 1 };",
		"export const notice = { template: 'default', data() { return { a: 1 }; }, a: 1 };",
		"import { Node } from 'ui.text-editor'; export const Header = Node.extend({ name: 'header', addAttributes() { return { a: 1 }; }, a: 1 });",
	],
	invalid: [
		{ code: `// @vue/component\nexport const Counter = ${body};`, errors: [dupe] },
		{ code: `export const Counter = ${body};`, errors: [dupe] },
		{ code: `export default ${body};`, errors: [dupe] },
		{ code: component(`export const Counter = defineComponent(${body});`), errors: [dupe] },
		{ code: component(`BitrixVue.component('ui-counter', ${body});`), errors: [dupe] },
		{ code: component(`BitrixVue.localComponent('ui-counter', ${body});`), errors: [dupe] },
		{ code: component(`BitrixVue.mutableComponent('ui-counter', ${body});`), errors: [dupe] },
		{ code: component(`createApp(${body}).mount('#app');`), errors: [dupe] },
		{ code: `export const Parent = {\n\tname: 'Parent',\n\ttemplate: '<Counter/>',\n\tcomponents: { Counter: ${body} },\n};`, errors: [dupe] },
	],
});

// require-default-prop reports any prop without a default of a component
ruleTester.run('vue-components: options of Dom.create are not a component', vue.rules['require-default-prop'], {
	valid: [
		"Dom.create('div', { props: { title: { type: String } }, attrs: {}, children: [] }); export {};",
	],
	invalid: [
		{
			code: "export const Title = { props: { title: { type: String } }, methods: {} };",
			errors: [{ messageId: 'missingDefault' }],
		},
	],
});
