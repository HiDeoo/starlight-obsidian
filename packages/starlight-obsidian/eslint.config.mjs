import hideoo from '@hideoo/eslint-config'

export default hideoo(
  {
    ignores: ['eslint.config.mjs'],
    languageOptions: {
      parserOptions: {
        project: ['../../tsconfig.json'],
      },
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    files: ['tests/markdown.test.ts'],
    rules: {
      'unicorn/no-incorrect-template-string-interpolation': 'off',
    },
  },
)
