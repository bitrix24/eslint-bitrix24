// Rules of eslint-plugin-sonarjs, written anew: the plugin itself is LGPL-licensed and
// cannot be bundled. Disable directives may name them by their ESLint ids (`sonarjs/...`).
import { withLegacyNames } from '../legacy-names.js';
import cognitiveComplexity from './cognitive-complexity.js';
import noDuplicatedBranches from './no-duplicated-branches.js';
import noExtraArguments from './no-extra-arguments.js';
import noIdenticalFunctions from './no-identical-functions.js';
import noUseOfEmptyReturnValue from './no-use-of-empty-return-value.js';

export default withLegacyNames({
	meta: { name: '@bitrix24/sonarjs' },
	rules: {
		'cognitive-complexity': cognitiveComplexity,
		'no-duplicated-branches': noDuplicatedBranches,
		'no-extra-arguments': noExtraArguments,
		'no-identical-functions': noIdenticalFunctions,
		'no-use-of-empty-return-value': noUseOfEmptyReturnValue,
	},
}, (name) => `sonarjs/${name}`);
