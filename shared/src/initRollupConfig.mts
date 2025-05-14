import type { RollupOptions } from 'rollup';
import type { Options, OutputFormat } from './types.mjs';
import { buildFormats, definePlugins, normalizeOutputs } from './utils/index.mjs';

export function initRollupConfig(options: Options = {}): readonly RollupOptions[] {
	const outputs = normalizeOutputs(options.outputs, options.globals);
	const plugins = definePlugins(options.plugins);

	return options.input!.flatMap((inputItem) => {
		const formats = buildFormats(inputItem, outputs, plugins);
		return Object.entries(formats).flatMap(([key, value]) =>
			outputs[key as OutputFormat].skip ? [] : value
		);
	});
}
