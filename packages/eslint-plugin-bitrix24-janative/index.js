import noGlobalRequire from './rules/no-global-require.js';
import noStaticVariableInClass from './rules/no-static-variable-in-class.js';

export default {
	rules: {
		'no-global-require': noGlobalRequire,
		'no-static-variable-in-class': noStaticVariableInClass,
	},
};
