import noIoWithoutPolyfill from './rules/no-io-without-polyfill.js';
import noPseudoPrivate from './rules/no-pseudo-private.js';
import noNativeEventsBinding from './rules/no-native-events-binding.js';
import noTypeof from './rules/no-typeof.js';
import noBxMessage from './rules/no-bx-message.js';
import noClasslist from './rules/no-classlist.js';
import noStyle from './rules/no-style.js';
import noJsdd from './rules/no-jsdd.js';
import noNativeDialogs from './rules/no-native-dialogs.js';
import noNativeDomMethods from './rules/no-native-dom-methods.js';
import noEventemitterWithoutNamespace from './rules/no-eventemitter-without-namespace.js';
import noNilCompare from './rules/no-nil-compare.js';
import noBx from './rules/no-bx.js';
import noPrivate from './rules/no-private.js';
import noShortClassProperty from './rules/no-short-class-property.js';
import needAlias from './rules/need-alias.js';
import sortImports from './rules/sort-imports.js';
import preferInlineTypeImports from './rules/prefer-inline-type-imports.js';
import braceOnSameLine from './rules/brace-on-same-line.js';

export default {
	rules: {
		'no-io-without-polyfill': noIoWithoutPolyfill,
		'no-pseudo-private': noPseudoPrivate,
		'no-native-events-binding': noNativeEventsBinding,
		'no-typeof': noTypeof,
		'no-bx-message': noBxMessage,
		'no-classlist': noClasslist,
		'no-style': noStyle,
		'no-jsdd': noJsdd,
		'no-native-dialogs': noNativeDialogs,
		'no-native-dom-methods': noNativeDomMethods,
		'no-eventemitter-without-namespace': noEventemitterWithoutNamespace,
		'no-nil-compare': noNilCompare,
		'no-bx': noBx,
		'no-private': noPrivate,
		'no-short-class-property': noShortClassProperty,
		'need-alias': needAlias,
		'sort-imports': sortImports,
		'prefer-inline-type-imports': preferInlineTypeImports,
		'brace-on-same-line': braceOnSameLine,
	},
};
