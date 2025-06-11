import js from '@eslint/js';
import parser from '@typescript-eslint/parser';
import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
      react: reactPlugin,
    },
    rules: {
      ...tsEslintPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**/*.ts', '**/__tests__/**/*.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        describe: true,
        it: true,
        expect: true,
        beforeAll: true,
        beforeEach: true,
        afterAll: true,
        jest: true,
        test: true,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: true,
        document: true,
        setTimeout: true,
        alert: true,
        prompt: true,
        console: true,
        require: true,
        global: true,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['e2e/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: './e2e/tsconfig.json',
      },
    },
  },
  {
    files: ['playwright.config.ts'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
  {
    ignores: ['dist/', 'dist/assets/', 'playwright.config.ts', 'vite.config.ts', 'e2e/tsconfig.json'],
  },
  {
    files: ['*.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
  },
];
