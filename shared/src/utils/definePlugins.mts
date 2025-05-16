import babel from '@rollup/plugin-babel';
import nodeResolve from '@rollup/plugin-node-resolve';
import type { Plugin } from 'rollup';
import type { PluginsOptions } from '../types.mjs';

const definePlugins = (plugins?: PluginsOptions): readonly Plugin[] => {
	const { node: nodeOverride, babel: babelOverride, ...restOfPlugins } = plugins ?? {};
	const pluginOverrides = Object.values(restOfPlugins).filter((plugin): plugin is Plugin =>
		Boolean(plugin)
	);

	return [
		...pluginOverrides,
		nodeOverride ?? nodeResolve({ extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
		babelOverride ??
			babel({
				babelHelpers: 'bundled',
				extensions: ['.js', '.jsx', '.ts', '.tsx'],
				plugins: [
					'annotate-pure-calls', // babel-plugin-annotate-pure-calls
				],
			}),
	];
};

export default definePlugins;
