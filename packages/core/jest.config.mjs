import { jestConfig } from '@calyjs-setup/shared';

/** @type {import('jest').Config} */
export default {
	...jestConfig,
	preset: 'ts-jest',
	transform: {
		'^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.spec.json' }],
	},
	testEnvironment: 'node',
};
