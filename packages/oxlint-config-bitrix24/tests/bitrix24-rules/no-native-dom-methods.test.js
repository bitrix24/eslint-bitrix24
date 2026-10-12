import { run } from './run.js';

const error = { messageId: 'moduleError' };

const valid = [
	// custom trees: BBCode nodes
	'export function f(node: BBCodeNode) { node.appendChild(child); }',
	'export function f(node: BBCodeNode | null) { node.removeChild(child); }',
	'export function f(node: BBCodeNode = null) { node.appendChild(child); }',
	'const node: BBCodeElementNode = scheme.createElement({ name: "p" }); node.appendChild(child);',
	'type Tree = BBCodeNode; export function f(tree: Tree) { tree.insertBefore(a, b); }',
	'export class A { parent: BBCodeNode; f() { this.parent.appendChild(child); } }',
	'export class A { #parent: BBCodeNode; f() { this.#parent.replaceChild(a, b); } }',
	'export class A { getParent(): BBCodeNode { return this.p; } f() { this.getParent().removeChild(this); } }',
	'export class Node { appendChild(child) {} f() { this.appendChild(child); } }',
	// values written to a variable
	'export function f(scheme: BBCodeScheme) { const p = scheme.createElement({ name: "p" }); p.appendChild(child); }',
	'export function f(scheme: BBCodeScheme) { let p = null; p = scheme.createElement({ name: "p" }); p.appendChild(child); }',
	'export function f() { const result: BBCodeRootNode = create(); const stack = [result]; const parent = stack[0]; parent.appendChild(child); }',
	'export function f(stack: Array<BBCodeNode>) { stack[0].appendChild(child); }',
	'export function f() { const node = new BBCodeNode(); node.appendChild(child); }',
	'export class A { getParent(): BBCodeNode | null { return null; } f() { const parent = this.getParent(); parent.removeChild(this); } }',
	// not the native signature
	'export function f(parent) { parent.replaceChild(node, ...children); }',
	'export function f(parent) { parent.appendChild(a, b); }',
	// not these methods
	'node.appendChildren(children);',
	'export function f(tab) { tab.removeChildren(); }',
	'export function f(node: BBCodeNode) { node.replaceChildren(a, b); }',
	'Dom.append(child, container);',
	'Dom.appendChild(child, container);',
];

const invalid = [
	{ code: 'document.body.appendChild(child); export {};', errors: [error] },
	{ code: 'export function f(node) { node.appendChild(child); }', errors: [error] },
	{ code: 'export function f(node: HTMLElement) { node.appendChild(child); }', errors: [error] },
	{ code: 'export function f(node: HTMLDivElement | null) { node.removeChild(child); }', errors: [error] },
	{ code: 'export function f(node: any) { node.appendChild(child); }', errors: [error] },
	{ code: 'type Container = HTMLElement; export function f(c: Container) { c.insertBefore(a, b); }', errors: [error] },
	{ code: 'export class A { container: HTMLElement; f() { this.container.appendChild(child); } }', errors: [error] },
	{ code: 'export class A { getContainer(): HTMLElement { return this.c; } f() { this.getContainer().appendChild(child); } }', errors: [error] },
	{ code: 'const div = document.createElement("div"); div.appendChild(child); export {};', errors: [error] },
	{ code: 'export class A { f() { this.appendChild(child); } }', errors: [error] },
	{ code: 'export function f() { const div = Tag.render`<div></div>`; div.appendChild(child); }', errors: [error] },
	{ code: 'export function f() { const fragment = document.createDocumentFragment(); fragment.appendChild(child); }', errors: [error] },
	{ code: 'export function f(scheme: BBCodeScheme) { let p = scheme.createElement(); p = document.createElement("p"); p.appendChild(child); }', errors: [error] },
	{ code: 'export function f(nodes: Array<HTMLElement>) { nodes[0].appendChild(child); }', errors: [error] },
	{ code: 'export function f(parent) { parent.insertBefore(node, null); }', errors: [error] },
	{ code: 'export function f(container) { container.replaceChildren(); }', errors: [error] },
	{ code: 'export function f(container) { container.replaceChildren(...nodes); }', errors: [error] },
];

run('no-native-dom-methods', { valid, invalid });
