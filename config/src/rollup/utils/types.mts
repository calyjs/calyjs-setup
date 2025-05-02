import { OUTPUT_FORMATS } from './constants.mjs';
import type {
  ExternalOption,
  GlobalsOption,
  Plugin
} from 'rollup';

type OutputProps = {
  globals?: GlobalsOption;
  file?: string;
};

export type OutputFormat = typeof OUTPUT_FORMATS[number];

export type OutputOptions = OutputProps | false;

export type InputOptions = {
  path: string;
  packageName: string;
  entryName: string;
};

export type PluginsOptions = {
  node?: Plugin;
  babel?: Plugin;
  [key: string]: Plugin | undefined;
};

export type NormalizedOutput = OutputProps & {
  skip: boolean;
  external?: ExternalOption;
};

export type Options = {
  input: Array<InputOptions>;
  plugins?: PluginsOptions;
  globals?: GlobalsOption;
  outputs?: Partial<Record<OutputFormat, OutputOptions>>;
};