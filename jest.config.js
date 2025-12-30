module.exports = {
  // Use jsdom environment for browser-like testing
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/main/webapp/js/mermaid-validator.js',
    'src/main/webapp/js/mermaid-parser.js',
    'src/main/webapp/js/canvas-inserter.js',
    'src/main/webapp/js/message-handler.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  // Coverage thresholds (target 80%)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Module paths
  roots: ['<rootDir>/tests', '<rootDir>/src'],
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true
};
