import openmrs from '@openmrs/eslint-config';

export default [
  {
    ignores: ['**/dist/**', '.yarn/**'],
  },
  ...openmrs,
  {
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['e2e/**'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
];
