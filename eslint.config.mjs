import hideoo from '@hideoo/eslint-config'

export default hideoo({
  files: ['**/*.ts'],
  rules: {
    '@typescript-eslint/no-empty-object-type': 'off',
  },
})
