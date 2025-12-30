/**
 * Jest setup file for Mermaid iframe integration tests
 * This file runs before each test suite
 */

// Extend Jest matchers if needed
expect.extend({
  toBeValidMessageFormat(received) {
    const pass = 
      received !== null &&
      typeof received === 'object' &&
      typeof received.action === 'string';
    
    if (pass) {
      return {
        message: () => `expected ${JSON.stringify(received)} not to be a valid message format`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${JSON.stringify(received)} to be a valid message format`,
        pass: false
      };
    }
  }
});

// Global test timeout (10 seconds for property-based tests)
jest.setTimeout(10000);

// Suppress console errors during tests (optional)
// global.console.error = jest.fn();
// global.console.warn = jest.fn();
