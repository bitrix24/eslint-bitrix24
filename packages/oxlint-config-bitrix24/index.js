import { plugins, jsPlugins } from './config/plugins.js';
import { overrides } from './config/overrides.js';
import { environment } from './config/environment.js';
import { rules as errorRules } from './config/rules/errors.js';
import { rules as bestPracticeRules } from './config/rules/best-practices.js';
import { rules as es6Rules } from './config/rules/es6.js';
import { rules as variableRules } from './config/rules/variables.js';
import { rules as styleRules } from './config/rules/style.js';
import { rules as stylisticRules } from './config/rules/stylistic.js';
import { rules as bitrixRules } from './config/rules/bitrix.js';
import { rules as unicornRules } from './config/rules/unicorn.js';
import { rules as importRules } from './config/rules/import.js';
import { rules as promiseRules } from './config/rules/promise.js';
import { rules as vueRules } from './config/rules/vue.js';
import { rules as qualityRules } from './config/rules/quality.js';

export default {
	plugins,
	jsPlugins,
	// Only the rules listed below are enabled.
	categories: {
		correctness: 'off',
	},
	rules: {
		...errorRules,
		...bestPracticeRules,
		...es6Rules,
		...variableRules,
		...styleRules,
		...stylisticRules,
		...bitrixRules,
		...unicornRules,
		...importRules,
		...promiseRules,
		...vueRules,
		...qualityRules,
	},
	overrides: [environment, ...overrides],
};
