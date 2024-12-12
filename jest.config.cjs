/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.test.ts'],
  transform: {
    "^.+\\.tsx?$": ['ts-jest', {
      useESM: true,
      tsconfig: 'tsconfig.json',
    }],
  },
};