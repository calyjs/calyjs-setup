import type { GlobalsOption } from 'rollup';
import type { NormalizedOutput, OutputFormat, OutputOptions } from './types.mjs';
import { OUTPUT_FORMATS } from './constants.mjs';

const normalizeOutputs = (
  outputs?: Partial<Record<OutputFormat, OutputOptions>>,
  globals?: GlobalsOption
): Record<OutputFormat, NormalizedOutput> => OUTPUT_FORMATS.reduce(
  (acc, format) => {
    // Get current output config options
    const formatOptions = outputs?.[format];

    // if current format is set tu false, then skip it
    if (formatOptions === false) {
      return {...acc, [format]: {skip: true}};
    }

    const {file, globals: formatGlobals = globals} = formatOptions ?? {};
    return {
      ...acc,
      [format]: {
        file,
        skip: false,
        globals: formatGlobals,
        external: formatGlobals ? Object.keys(formatGlobals) : undefined,
      },
    };
  },
  {} as Record<OutputFormat, NormalizedOutput>,
);

export default normalizeOutputs;