export const babelConfig = {
	presets: [
		[
			'@babel/preset-env',
			{
				targets: {
					node: 'current',
				},
			},
		],
		'@babel/preset-typescript',
	],
	assumptions: {
		arrayLikeIsIterable: true,
		constantReexports: true,
		ignoreFunctionLength: true,
		ignoreToPrimitiveHint: true,
		mutableTemplateObject: true,
		noClassCalls: true,
		noDocumentAll: true,
		objectRestNoSymbols: true,
		privateFieldsAsProperties: true,
		pureGetters: true,
		setClassMethods: true,
		setComputedProperties: true,
		setPublicClassFields: true,
		setSpreadProperties: true,
		skipForOfIteratorClosing: true,
		superIsCallableConstructor: true,
	},
};
