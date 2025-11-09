import nextPlugin from 'eslint-config-next'

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
  {
    ignores: ['**/node_modules/**', '**/.next/**', '**/out/**'],
  },
  ...nextPlugin(),
]

export default config

