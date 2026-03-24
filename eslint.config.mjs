import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import sortDestructureKeysPlugin from 'eslint-plugin-sort-destructure-keys';
import reactPlugin from 'eslint-plugin-react';
import vitestPlugin from '@vitest/eslint-plugin';

export default tseslint.config(
  {
    ignores: ['dist', 'src/@types', '*.{js,ts}'],
  },
  {
    name: 'default',
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactPlugin.configs.flat.recommended,
    ],
    files: ['src/**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
      'sort-destructure-keys': sortDestructureKeysPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      camelcase: 'off',
      semi: ['warn', 'always'],
      eqeqeq: ['error', 'smart'],
      'array-callback-return': 'error',
      'arrow-body-style': 'error',
      'comma-dangle': 'off',
      'default-case': 'error',
      'jsx-quotes': ['error', 'prefer-single'],
      'linebreak-style': ['error', 'unix'],
      'no-console': 'off',
      'no-mixed-spaces-and-tabs': 'warn',
      'no-self-compare': 'error',
      'no-underscore-dangle': [
        'error',
        { allow: ['_internalState'], allowAfterThis: true },
      ],
      'no-use-before-define': 'off',
      'no-useless-concat': 'error',
      'no-var': 'error',
      'no-script-url': 'error',
      'no-continue': 'off',
      'object-shorthand': 'warn',
      'prefer-const': 'warn',
      'require-await': 'error',
      'sort-destructure-keys/sort-destructure-keys': ['error', { caseSensitive: false }],
      'sort-imports': [
        'error',
        {
          allowSeparatedGroups: true,
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],
      'sort-keys': ['error', 'asc', { caseSensitive: false, minKeys: 2, natural: false }],
      'valid-typeof': 'error',
      'max-classes-per-file': 'off',
      'no-unused-expressions': 'off',
      'import/prefer-default-export': 'off',
      'import/extensions': 'off',
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: true, // TODO: set to false once React is in the dependencies (not devDependencies)
          optionalDependencies: false,
          peerDependencies: false,
        },
      ],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { ignoreRestSiblings: false, caughtErrors: 'none' },
      ],
      '@typescript-eslint/no-unsafe-function-type': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-wrapper-object-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-empty-function': 'off',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-require-imports': 'off', // TODO: remove this rule once all files are .mjs (and require is not used)
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/display-name': 'warn',
      'react/jsx-sort-props': [
        'error',
        {
          callbacksLast: false,
          ignoreCase: true,
          noSortAlphabetically: false,
          reservedFirst: false,
          shorthandFirst: false,
          shorthandLast: false,
        },
      ],
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    name: 'vitest',
    files: ['src/**/__tests__/**'],
    plugins: { vitest: vitestPlugin },
    languageOptions: {
      globals: vitestPlugin.environments.env.globals,
    },
    rules: {
      'vitest/expect-expect': 'off',
      'vitest/no-conditional-expect': 'off',
      'vitest/prefer-inline-snapshots': 'off',
      'vitest/prefer-lowercase-title': 'off',
      'vitest/prefer-expect-assertions': 'off',
      'vitest/no-hooks': 'off',
      'vitest/prefer-spy-on': 'warn',
      '@typescript-eslint/no-empty-function': 'off', // explicitly disable for tests
    },
  },
);
