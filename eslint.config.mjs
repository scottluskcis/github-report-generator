import { fileURLToPath } from 'url';
import { dirname } from 'path';
import globals from 'globals';
import pluginJs from '@eslint/js';
import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
import tsEslintParser from '@typescript-eslint/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('eslint').Linter.Config} */
export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    ignores: ['dist/'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest, 
      },
      parser: tsEslintParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...tsEslintPlugin.configs.recommended.rules,
      // Add any custom rules here
    },
  },
];