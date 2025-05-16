import { initRollupConfig } from '@calyjs-setup/shared';

export default initRollupConfig({
	input: [
		{
			path: './src/index.ts',
			packageName: 'core',
			entryName: 'CalyJSCore',
		},
	],
	globals: {
		'@calyjs-setup/utils': 'CalyJSUtils',
	},
	outputs: {
		cjs: false,
	},
});
