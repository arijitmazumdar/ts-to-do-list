/**
 * Prettier configuration for the TypeScript to-do list project.
 *
 * Keeps formatting consistent across source, tests, templates, and docs.
 */
module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  printWidth: 100,
  endOfLine: 'lf',
  overrides: [
    {
      files: ['*.md', '*.mdx'],
      options: {
        proseWrap: 'always',
      },
    },
    {
      files: ['*.json', '*.jsonc'],
      options: {
        trailingComma: 'all',
      },
    },
  ],
};
