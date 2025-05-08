import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import type { Plugin } from 'rollup';
import type { PluginsOptions } from '../types.mjs';

const definePlugins = (plugins?: PluginsOptions): readonly Plugin[] => {
	const { node: nodeOverride, babel: babelOverride, ...restOfPlugins } = plugins ?? {};

	return [
		...Object.values(restOfPlugins).filter((plugin): plugin is Plugin => Boolean(plugin)),
		nodeOverride ?? nodeResolve({ extensions: ['.ts', '.tsx'] }),
		babelOverride ??
			babel({
				babelHelpers: 'bundled',
				extensions: ['.ts', '.tsx'],
				plugins: [
					'annotate-pure-calls', // babel-plugin-annotate-pure-calls
				],
			}),
	];
};

export default definePlugins;
