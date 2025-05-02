import type { RollupOptions } from 'rollup';
import {
  buildFormats,
  definePlugins,
  normalizeOutputs,
  type Options
} from './utils/index.mjs';

const strictlyTypedEntries = Object.entries as <T extends object>(
  o: T,
) => {[K in keyof T]: [K, T[K]]}[keyof T][];

function initRollupConfig(options: Options): readonly RollupOptions[] {
  const {input, plugins, globals, outputs} = options ?? {};

  const _outputs = normalizeOutputs(outputs, globals);
  const _plugins = definePlugins(plugins);

  return input.flatMap((inputItem) => {
    const _formats = buildFormats(inputItem, _outputs, _plugins);
    
    return strictlyTypedEntries(_formats).flatMap(
      ([key, value]) => (_outputs[key].skip ? [] : value),
    );
  });
}

export default initRollupConfig;