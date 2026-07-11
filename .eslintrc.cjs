module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    '@electron-toolkit/eslint-config-ts/recommended',
    '@electron-toolkit/eslint-config-prettier'
  ],
  rules: {
    // Return types are inferred by TypeScript; requiring them on every
    // component/handler adds noise without catching real bugs.
    '@typescript-eslint/explicit-function-return-type': 'off',
    // Allow intentionally-unused values when prefixed with _
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true }
    ]
  }
}
