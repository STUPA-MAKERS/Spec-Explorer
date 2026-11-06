/** Jest: the unit tests of the frontend. The ui-kit comes from the submodule source. */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '^@stupa-makers/ui-kit/shell$': '<rootDir>/vendor/ui-kit/shell/src/public-api.ts',
    '^@stupa-makers/ui-kit/markdown-view$': '<rootDir>/vendor/ui-kit/markdown-view/src/public-api.ts',
    '^@stupa-makers/ui-kit$': '<rootDir>/vendor/ui-kit/src/public-api.ts',
    '\\.(css|scss)$': '<rootDir>/src/testing/style-mock.js',
  },
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      { tsconfig: '<rootDir>/tsconfig.spec.json', stringifyContentPathRegex: '\\.(html|svg)$' },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|@angular|rxjs)'],
  collectCoverageFrom: ['src/app/**/*.ts', '!src/app/**/*.spec.ts'],
  coverageThreshold: { global: { statements: 90, branches: 70, functions: 85, lines: 90 } },
};
