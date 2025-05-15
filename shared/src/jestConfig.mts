import type { Config } from 'jest';

const ignorePatterns = ['<rootDir>/dist/', '<rootDir>/out-tsc/', '<rootDir>/node_modules/'];

export const jestConfig: Config = {
	globals: {
		__DEV__: true,
	},
	verbose: true,
	clearMocks: true,
	passWithNoTests: false,
	collectCoverage: true,
	coverageProvider: 'babel',
	coverageDirectory: 'coverage',
	testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
	resetMocks: true,
	collectCoverageFrom: [
		'src/**/*.[jt]s?(x)',
		'!src/index.*',
		'!src/**/types.*',
		'!src/**/__tests__/**',
		'!src/**/?(*.)+(spec|test).[jt]s?(x)',
		'!test/**/*',
	],
	coveragePathIgnorePatterns: ignorePatterns,
	testPathIgnorePatterns: ignorePatterns,
	reporters: [
		'default',
		[
			'jest-junit',
			{
				outputDirectory: './test-results/unit/',
				outputName: 'junit.xml',
				usePathForSuiteName: true,
				includeConsoleOutput: true,
			},
		],
	],
};
