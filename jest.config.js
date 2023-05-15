module.exports = {
  transform: {
    '^.+\\.(m?j|t)sx?$': ['@swc/jest'],
  },
  transformIgnorePatterns: ['/node_modules/(?!@openmrs|dexie)'],
  moduleNameMapper: {
    '\\.(s?css)$': 'identity-obj-proxy',
    '@openmrs/esm-framework': '@openmrs/esm-framework/mock',
    '^lodash-es/(.*)$': 'lodash/$1',
  },
  collectCoverageFrom: [
    '**/src/**/*.component.tsx',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/src/**/*.test.*',
    '!**/src/declarations.d.tsx',
    '!**/e2e/**',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tools/setupTests.ts'],
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    url: 'http://localhost/',
  },
  testPathIgnorePatterns: ['<rootDir>/e2e'],
};
