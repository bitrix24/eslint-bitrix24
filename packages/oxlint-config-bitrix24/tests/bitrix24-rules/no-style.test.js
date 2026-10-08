import { run } from './run.js';

const error = { messageId: 'moduleError' };

run('no-style', {
	valid: [
		// a private field holding CSS class names
		'export class Block { #style = { page: "page" }; f() { Dom.addClass(node, this.#style.page); } }',
		// the style options of a custom object
		'export function f(options: BlockOptions) { return options.style.color; }',
		'Dom.style(node, "display", "none"); export {};',
	],
	invalid: [
		{ code: 'export function f(node) { node.style.display = "none"; }', errors: [error] },
		{ code: 'export function f(node: HTMLElement) { return node.style.width; }', errors: [error] },
		{ code: 'document.body.style.overflow = "hidden"; export {};', errors: [error] },
		{ code: 'export class A { node: HTMLDivElement; f() { this.node.style.height = "1px"; } }', errors: [error] },
	],
});
