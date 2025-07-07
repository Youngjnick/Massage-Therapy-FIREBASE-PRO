// import js from '@eslint/js'; // Removed duplicate
// import parser from '@typescript-eslint/parser'; // Removed duplicate
// import tsEslintPlugin from '@typescript-eslint/eslint-plugin'; // Removed duplicate
// import reactPlugin from 'eslint-plugin-react'; // Removed duplicate
// import prettier from 'eslint-config-prettier'; // Removed duplicate
// import babelParser from '@babel/eslint-parser'; // Removed duplicate
// Top-level ignores for all generated, report, and trace folders
const globalIgnores = [
  'node_modules/',
  'dist/',
  'build/',
  'coverage/',
  '.vite/',
  'dataconnect-generated/',
  'playwright-report/',
  'playwright-report/**',
  'playwright-report/trace/',
  'playwright-report/trace/**',
  'test-results/',
  'emulator-data/',
  '.env',
  '*.log',
  'tmp-worktree-*',
  'tmp-worktree-*/**',
];
import js from '@eslint/js';
import parser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import prettier from 'eslint-config-prettier';
import babelParser from '@babel/eslint-parser';
import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
export default [
  {
    ignores: globalIgnores,
  },
  // js.configs.recommended, // Removed: not defined
  // prettier, // Removed: not defined
  {
    files: [
      'src/__tests__/*.ts',
      'src/__tests__/*.tsx',
      'src/__tests__/**/*.ts',
      'src/__tests__/**/*.tsx',
      '__tests__/*.ts',
      '__tests__/*.tsx',
      '__tests__/**/*.ts',
      '__tests__/**/*.tsx',
      '**/*.test.ts',
      '**/*.test.tsx',
      'src/__tests__/static.badgeimages-dist.test.ts',
      'src/__tests__/static.badgeimages-public.test.ts',
    ],
    languageOptions: {
      parser,
      parserOptions: {
        project: './tsconfig.test.json',
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
        window: true,
        document: true,
        setTimeout: true,
        console: true,
        global: true,
        alert: true,
        process: true,
      },
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
      react: reactPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
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
        console: true,
        global: true,
        alert: true,
      },
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
      react: reactPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['e2e/**/*.ts', 'e2e/**/*.tsx'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: './e2e/tsconfig.json',
        ecmaFeatures: { jsx: true },
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        document: 'readonly',
        window: 'readonly',
        navigator: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
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
    files: ['*.js', '**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        URL: 'readonly',
      },
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        URL: 'readonly',
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'script',
      },
    },
  },
  {
    files: ['**/*.jsx'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-react'],
        },
        ecmaFeatures: { jsx: true },
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      react: reactPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['**/*.test.jsx', '**/__tests__/**/*.jsx'],
    languageOptions: {
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
  },
  {
    files: ['tests/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        describe: true,
        it: true,
        expect: true,
        beforeAll: true,
        beforeEach: true,
        afterAll: true,
        jest: true,
        test: true,
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
        process: true,
      },
    },
  },
  {
    files: ['scripts/**/*.js', 'upload_questions_to_firestore_2.js', 'fix_skipped_questions.cjs', 'mergeSkippedQuestions.js'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        URL: 'readonly',
      },
    },
  },
  // Ignore unused vars in type/interface definitions, only check real code
  {
    files: ['*.ts', '*.tsx', 'src/setupTests.ts'],
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
    },
    languageOptions: {
      globals: {
        process: true,
      },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
];