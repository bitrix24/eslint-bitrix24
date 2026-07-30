import depsExternalBundle from './rules/deps-external-bundle.js';
import depsMissingEntry from './rules/deps-missing-entry.js';
import depsUnresolvedRequire from './rules/deps-unresolved-require.js';
import noGlobalRequire from './rules/no-global-require.js';
import noStaticVariableInClass from './rules/no-static-variable-in-class.js';

export default {
	rules: {
		'deps-external-bundle': depsExternalBundle,
		'deps-missing-entry': depsMissingEntry,
		'deps-unresolved-require': depsUnresolvedRequire,
		'no-global-require': noGlobalRequire,
		'no-static-variable-in-class': noStaticVariableInClass,
	},
};
