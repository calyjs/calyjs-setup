import { initRollupConfig } from '@calyjs-setup/shared';

export default initRollupConfig({
	input: [
		{
			path: './src/index.ts',
			packageName: 'utils',
			entryName: 'CalyJSUtils',
		},
	],
	outputs: {
		cjs: false,
		browser: false,
	},
});
