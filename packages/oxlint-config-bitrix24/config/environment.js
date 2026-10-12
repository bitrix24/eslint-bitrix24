// Globals of every linted file.
//
// Declared as an override rather than top-level `env`/`globals`: oxlint does not carry
// top-level `env` and `globals` over through `extends`, while overrides are kept.
export const environment = {
	files: ['**/*'],
	env: {
		browser: true,
		es2021: true,
	},
	globals: {
		BX: 'readonly',
	},
};
