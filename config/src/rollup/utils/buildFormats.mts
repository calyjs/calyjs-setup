import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import { REPO_NAME } from './constants.mjs';
import type { Plugin, RollupOptions } from 'rollup';
import type {
  NormalizedOutput,
  OutputFormat,
  InputOptions
} from './types.mjs';

const buildFormats = (
  input: InputOptions,
  outputs: Record<OutputFormat, NormalizedOutput>,
  plugins: readonly Plugin[]
): Record<OutputFormat, readonly RollupOptions[] | RollupOptions> => ({
  esm: {
    input: input.path,
    output: {
      file: outputs.esm.file ?? `./dist/${REPO_NAME}.${input.packageName}.esm.js`,
      format: 'esm',
    },
    external: outputs.esm.external,
    plugins: [
      replace({
        __DEV__: 'process.env.NODE_ENV !== "production"',
        preventAssignment: true,
      }),
      ...plugins,
    ],
  },
  mjs: {
    input: input.path,
    output: {
      file: outputs.mjs.file ?? `./dist/${REPO_NAME}.${input.packageName}.mjs`,
      format: 'esm',
    },
    external: outputs.mjs.external,
    plugins: [
      replace({
        __DEV__: 'process.env.NODE_ENV !== "production"',
        preventAssignment: true,
      }),
      ...plugins,
    ],
  },
  cjs: {
    input: input.path,
    output: {
      name: input.entryName,
      file: outputs.cjs.file ?? `./dist/${REPO_NAME}.${input.packageName}.cjs`,
      globals: outputs.cjs.globals,
      format: 'cjs',
    },
    external: outputs.cjs.external,
    plugins: [
      replace({
        __DEV__: 'process.env.NODE_ENV !== "production"',
        preventAssignment: true,
      }),
      ...plugins,
    ],
  },
  umd: [
    {
      input: input.path,
      output: {
        name: input.entryName,
        file: outputs.umd.file ?? `./dist/${REPO_NAME}.${input.packageName}.umd.js`,
        format: 'umd',
        globals: outputs.umd.globals,
      },
      external: outputs.umd.external,
      plugins: [
        replace({
          __DEV__: 'true',
          preventAssignment: true,
        }),
        ...plugins,
      ],
    },
    {
      input: input.path,
      output: {
        name: input.entryName,
        file: outputs.umd.file ?? `./dist/${REPO_NAME}.${input.packageName}.umd.min.js`,
        format: 'umd',
        globals: outputs.umd.globals,
      },
      external: outputs.umd.external,
      plugins: [
        replace({
          __DEV__: 'false',
          preventAssignment: true,
        }),
        ...plugins,
        terser(),
      ],
    },
  ],
  browser: [
    {
      input: input.path,
      output: {
        file: outputs.browser.file ?? `./dist/${REPO_NAME}.${input.packageName}.browser.mjs`,
        format: 'esm',
      },
      external: outputs.browser.external,
      plugins: [
        replace({
          __DEV__: 'true',
          preventAssignment: true,
        }),
        ...plugins,
      ],
    },
    {
      input: input.path,
      output: {
        file: outputs.browser.file ?? `./dist/${REPO_NAME}.${input.packageName}.browser.min.mjs`,
        format: 'esm',
      },
      external: outputs.browser.external,
      plugins: [
        replace({
          __DEV__: 'false',
          preventAssignment: true,
        }),
        ...plugins,
        terser(),
      ],
    },
  ],
});

export default buildFormats;