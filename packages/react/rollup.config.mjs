import { initRollupConfig } from '@calyjs-setup/shared';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import babel from '@rollup/plugin-babel';

export default initRollupConfig({
	input: [
		{
			path: './src/index.ts',
			packageName: 'react',
			entryName: 'CalyJSReact',
		},
	],
	globals: {
		react: 'React',
		'react-dom': 'ReactDOM',
		'react/jsx-runtime': 'jsxRuntime',
	},
	outputs: {
		cjs: false,
		browser: false,
	},
	plugins: {
		peerDepsExternal: peerDepsExternal(),
		babel: babel({
			babelHelpers: 'bundled',
			presets: ['@babel/preset-react'],
			extensions: ['.ts', '.tsx'],
			plugins: ['annotate-pure-calls'],
		}),
	},
});
