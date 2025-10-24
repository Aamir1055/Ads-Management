module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverage: true,
  collectCoverageFrom: [
    'app.js',
    'controllers/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js'
  ],
  coverageDirectory: 'coverage',
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};