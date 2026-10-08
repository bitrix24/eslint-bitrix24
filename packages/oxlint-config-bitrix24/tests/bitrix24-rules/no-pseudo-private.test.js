import { run } from './run.js';

const error = { messageId: 'error' };

run('no-pseudo-private', {
	valid: [
		'export function f() { const _this = this; let _height = 0; return [_this, _height]; }',
		'function _helper() {} export { _helper };',
		'export function f(status) { status._shownCount += 1; }',
		'export class A { #items = []; #load() {} }',
	],
	invalid: [
		{ code: 'export class A { _items = []; }', errors: [error] },
		{ code: 'export class A { _load() {} }', errors: [error] },
		{ code: 'export class A { constructor() { this._items = []; } }', errors: [error] },
		{ code: 'export class A { static _cache = null; }', errors: [error] },
	],
});
