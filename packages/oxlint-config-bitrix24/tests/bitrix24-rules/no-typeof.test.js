import { run } from './run.js';

const error = { messageId: 'moduleError' };

run('no-typeof', {
	valid: [
		// a global that may be missing: Type.isUndefined(ResizeObserver) would throw
		'if (typeof ResizeObserver !== "undefined") {} export {};',
		'if (typeof BXDesktopSystem === "undefined") {} export {};',
		// the type name as a value
		'export function f(value) { return typeof value; }',
		'export function f(value) { throw new TypeError(`Unexpected ${typeof value}`); }',
	],
	invalid: [
		{ code: 'export function f(value) { return typeof value === "string"; }', errors: [error] },
		{ code: 'export function f(options) { if (typeof options.onClose === "function") {} }', errors: [error] },
		{ code: 'export function f(value) { switch (typeof value) { default: } }', errors: [error] },
		{ code: 'if (typeof window.ResizeObserver !== "undefined") {} export {};', errors: [error] },
	],
});
