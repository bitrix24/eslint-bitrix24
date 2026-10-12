import { run } from './run.js';

const error = { messageId: 'moduleError' };

run('no-native-events-binding', {
	valid: [
		// event targets of their own: calls, peer connections, tracks
		'export class C { currentCall: PlainCall | VoximplantCall | null; f() { this.currentCall.addEventListener(CallEvent.onJoin, h); } }',
		'export function f(connection: RTCPeerConnection) { connection.addEventListener("track", h); }',
		'export function f() { const socket = new WebSocket(url); socket.addEventListener("message", h); }',
		'export function f(signal: AbortSignal) { signal.removeEventListener("abort", h); }',
		'export class Emitter { addEventListener(name, handler) {} f() { this.addEventListener("x", h); } }',
	],
	invalid: [
		{ code: 'window.addEventListener("resize", h); export {};', errors: [error] },
		{ code: 'document.removeEventListener("click", h); export {};', errors: [error] },
		{ code: 'export function f(node: HTMLElement) { node.addEventListener("click", h); }', errors: [error] },
		{ code: 'export function f(node) { node.addEventListener("click", h); }', errors: [error] },
		{ code: 'export function f() { const button = Tag.render`<button></button>`; button.addEventListener("click", h); }', errors: [error] },
		{ code: 'export class A { container: HTMLElement; f() { this.container.addEventListener("click", h); } }', errors: [error] },
		// the properties of objects are not followed: `options.container` is often an element
		{ code: 'export function f(controller: AbortController) { controller.signal.addEventListener("abort", h); }', errors: [error] },
	],
});
