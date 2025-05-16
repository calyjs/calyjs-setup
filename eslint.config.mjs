import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    // Shared global settings
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'no-console': ['error', { 'allow': ['warn', 'error'] }],
      'no-undef': 'off'
    }
  },
  {
    // JavaScript (vanilla) rules
    ...js.configs.recommended,
    files: ['**/*.js', '**/*.jsx'],
    rules: {
      'no-unused-vars': 'error',
    }
  },
  {
    // TypeScript-specific rules
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' }
      ],
    }
  },
  {
    // Ignore files
    ignores: [
      '**/node_modules/**',
      '**/coverage/**',
      '**/dist/**',
      '**/out-tsc/**',
      '**/test-results/**',
      '**/*.md'
    ]
  }
]);