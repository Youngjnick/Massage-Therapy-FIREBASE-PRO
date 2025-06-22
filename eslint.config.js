import js from '@eslint/js';
import parser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import prettier from 'eslint-config-prettier';
import babelParser from '@babel/eslint-parser';
import tsEslintPlugin from '@typescript-eslint/eslint-plugin';

export default [
  js.configs.recommended,
  prettier,
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
    ignores: [
      '.vite/',
      'dist/',
      'dataconnect-generated/',
      'node_modules/',
      'playwright.config.ts',
      'vite.config.ts',
      'e2e/tsconfig.json',
      'src/__tests__/static.badgeimages-dist.test.ts',
      'src/__tests__/static.badgeimages-public.test.ts',
      'upload_questions_to_firestore_2.js', // Exclude problematic ESM import assertion file
    ],
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
    ignores: [
      'src/components/Quiz/QuizCheckbox.tsx',
      'src/components/Quiz/QuizLengthInput.tsx',
      'src/components/Quiz/QuizRandomizeOptions.tsx',
      'src/components/Quiz/QuizSortSelect.tsx',
      'src/components/Quiz/QuizBookmarkItem.tsx',
      'src/components/Quiz/QuizBookmarksPanel.tsx',
      'src/components/Quiz/QuizQuestionCard.tsx',
      'src/components/Quiz/QuizStartControls.tsx',
      'src/components/Quiz/QuizStartForm.tsx',
      'src/components/Quiz/QuizStepper.tsx',
      'src/components/Quiz/QuizTopicSelect.tsx',
      'src/components/Quiz/useQuizKeyboardNavigation.ts',
      'src/context/FeatureFlagContext.tsx',
      'src/context/QuizContext.tsx',
      'src/context/ToastContext.tsx',
      'src/hooks/useQuizData.ts',
      'src/hooks/useUserStats.ts',
      'src/pages/Analytics.test.tsx',
      'src/__tests__/Analytics.integration.test.tsx',
      'src/__tests__/QuizResultsLiveStats.integration.test.tsx'
    ],
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
  {
    files: ['src/setupTests.ts', '**/*.test.ts', '**/*.test.tsx', '**/__tests__/**/*.ts', '**/__tests__/**/*.tsx'],
    languageOptions: {
      globals: {
        process: 'readonly',
      },
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '.env',
      '*.log',
    ],
  },
  {
    files: [
      'src/__tests__/*.js',
      'src/__tests__/**/*.js',
      '__tests__/*.js',
      '__tests__/**/*.js',
      '**/*.test.js',
      '**/*.test.jsx',
    ],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ['@babel/preset-env', '@babel/preset-react'],
        },
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
        __dirname: true,
        require: true,
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-undef': 'off',
    },
  },
];
