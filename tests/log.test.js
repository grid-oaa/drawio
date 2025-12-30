/**
 * Tests for log function
 * Validates Requirements 7.1, 7.2, 7.3
 */

const { createMockWindow } = require('./helpers/mocks');

// Load the validator module once
require('../src/main/webapp/js/mermaid-validator.js');

describe('log Function', () => {
	let MermaidValidator;
	let originalConsole;
	let consoleOutput;

	beforeEach(() => {
		// Get reference to MermaidValidator
		MermaidValidator = window.MermaidValidator;

		// Mock console methods to capture output
		originalConsole = {
			log: console.log,
			error: console.error,
			warn: console.warn
		};

		consoleOutput = {
			log: [],
			error: [],
			warn: []
		};

		console.log = jest.fn((...args) => consoleOutput.log.push(args));
		console.error = jest.fn((...args) => consoleOutput.error.push(args));
		console.warn = jest.fn((...args) => consoleOutput.warn.push(args));
	});

	afterEach(() => {
		// Restore console
		console.log = originalConsole.log;
		console.error = originalConsole.error;
		console.warn = originalConsole.warn;
	});

	describe('Log Levels', () => {
		test('should log error messages using console.error', () => {
			MermaidValidator.log('error', 'Test error message');

			expect(console.error).toHaveBeenCalled();
			expect(consoleOutput.error.length).toBe(1);
			expect(consoleOutput.error[0][0]).toContain('[ERROR]');
			expect(consoleOutput.error[0][0]).toContain('Test error message');
		});

		test('should log warn messages using console.warn', () => {
			MermaidValidator.log('warn', 'Test warning message');

			expect(console.warn).toHaveBeenCalled();
			expect(consoleOutput.warn.length).toBe(1);
			expect(consoleOutput.warn[0][0]).toContain('[WARN]');
			expect(consoleOutput.warn[0][0]).toContain('Test warning message');
		});

		test('should log info messages using console.log', () => {
			MermaidValidator.log('info', 'Test info message');

			expect(console.log).toHaveBeenCalled();
			expect(consoleOutput.log.length).toBe(1);
			expect(consoleOutput.log[0][0]).toContain('[INFO]');
			expect(consoleOutput.log[0][0]).toContain('Test info message');
		});

		test('should log debug messages using console.log when debug mode is enabled', () => {
			// Enable debug mode
			MermaidValidator.CONFIG.DEBUG_MODE = true;

			MermaidValidator.log('debug', 'Test debug message');

			expect(console.log).toHaveBeenCalled();
			expect(consoleOutput.log.length).toBe(1);
			expect(consoleOutput.log[0][0]).toContain('[DEBUG]');
			expect(consoleOutput.log[0][0]).toContain('Test debug message');

			// Reset debug mode
			MermaidValidator.CONFIG.DEBUG_MODE = false;
		});

		test('should not log debug messages when debug mode is disabled', () => {
			// Ensure debug mode is disabled
			MermaidValidator.CONFIG.DEBUG_MODE = false;

			MermaidValidator.log('debug', 'Test debug message');

			expect(console.log).not.toHaveBeenCalled();
			expect(consoleOutput.log.length).toBe(0);
		});

		test('should reject invalid log levels', () => {
			MermaidValidator.log('invalid', 'Test message');

			expect(console.error).toHaveBeenCalled();
			expect(consoleOutput.error[0][0]).toContain('Invalid log level');
		});
	});

	describe('Message Formatting', () => {
		test('should include timestamp in ISO format', () => {
			MermaidValidator.log('info', 'Test message');

			const logMessage = consoleOutput.log[0][0];
			// Check for ISO timestamp format: [YYYY-MM-DDTHH:MM:SS.sssZ]
			expect(logMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
		});

		test('should include log level in uppercase', () => {
			MermaidValidator.log('error', 'Test message');
			expect(consoleOutput.error[0][0]).toContain('[ERROR]');

			MermaidValidator.log('warn', 'Test message');
			expect(consoleOutput.warn[0][0]).toContain('[WARN]');

			MermaidValidator.log('info', 'Test message');
			expect(consoleOutput.log[0][0]).toContain('[INFO]');
		});

		test('should include the message text', () => {
			const testMessage = 'This is a test message';
			MermaidValidator.log('info', testMessage);

			expect(consoleOutput.log[0][0]).toContain(testMessage);
		});

		test('should format message as: [timestamp] [LEVEL] message', () => {
			MermaidValidator.log('info', 'Test message');

			const logMessage = consoleOutput.log[0][0];
			// Check format: [timestamp] [LEVEL] message
			expect(logMessage).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[INFO\] Test message$/);
		});
	});

	describe('Context Parameter', () => {
		test('should log context object with error', () => {
			const context = { code: 'TEST_ERROR', details: 'Test details' };
			MermaidValidator.log('error', 'Error occurred', context);

			expect(console.error).toHaveBeenCalled();
			expect(consoleOutput.error[0].length).toBe(2);
			expect(consoleOutput.error[0][1]).toEqual(context);
		});

		test('should log context object with warn', () => {
			const context = { warning: 'Test warning' };
			MermaidValidator.log('warn', 'Warning occurred', context);

			expect(console.warn).toHaveBeenCalled();
			expect(consoleOutput.warn[0].length).toBe(2);
			expect(consoleOutput.warn[0][1]).toEqual(context);
		});

		test('should log context object with info', () => {
			const context = { info: 'Additional info' };
			MermaidValidator.log('info', 'Info message', context);

			expect(console.log).toHaveBeenCalled();
			expect(consoleOutput.log[0].length).toBe(2);
			expect(consoleOutput.log[0][1]).toEqual(context);
		});

		test('should handle Error objects as context', () => {
			const error = new Error('Test error');
			MermaidValidator.log('error', 'Exception occurred', error);

			expect(console.error).toHaveBeenCalled();
			expect(consoleOutput.error[0][1]).toBe(error);
		});

		test('should handle undefined context', () => {
			MermaidValidator.log('info', 'Message without context');

			expect(console.log).toHaveBeenCalled();
			expect(consoleOutput.log[0].length).toBe(1);
		});

		test('should handle null context', () => {
			MermaidValidator.log('info', 'Message with null context', null);

			expect(console.log).toHaveBeenCalled();
			// null is a valid context value, so it should be logged
			expect(consoleOutput.log[0].length).toBe(2);
			expect(consoleOutput.log[0][1]).toBe(null);
		});
	});

	describe('Debug Mode Control', () => {
		test('should respect DEBUG_MODE for debug logs', () => {
			// Test with debug mode off
			MermaidValidator.CONFIG.DEBUG_MODE = false;
			MermaidValidator.log('debug', 'Debug message 1');
			expect(consoleOutput.log.length).toBe(0);

			// Test with debug mode on
			MermaidValidator.CONFIG.DEBUG_MODE = true;
			MermaidValidator.log('debug', 'Debug message 2');
			expect(consoleOutput.log.length).toBe(1);

			// Reset
			MermaidValidator.CONFIG.DEBUG_MODE = false;
		});

		test('should always log error messages regardless of debug mode', () => {
			MermaidValidator.CONFIG.DEBUG_MODE = false;
			MermaidValidator.log('error', 'Error message');
			expect(consoleOutput.error.length).toBe(1);

			MermaidValidator.CONFIG.DEBUG_MODE = true;
			MermaidValidator.log('error', 'Error message 2');
			expect(consoleOutput.error.length).toBe(2);

			// Reset
			MermaidValidator.CONFIG.DEBUG_MODE = false;
		});

		test('should always log warn messages regardless of debug mode', () => {
			MermaidValidator.CONFIG.DEBUG_MODE = false;
			MermaidValidator.log('warn', 'Warning message');
			expect(consoleOutput.warn.length).toBe(1);

			MermaidValidator.CONFIG.DEBUG_MODE = true;
			MermaidValidator.log('warn', 'Warning message 2');
			expect(consoleOutput.warn.length).toBe(2);

			// Reset
			MermaidValidator.CONFIG.DEBUG_MODE = false;
		});

		test('should always log info messages regardless of debug mode', () => {
			MermaidValidator.CONFIG.DEBUG_MODE = false;
			MermaidValidator.log('info', 'Info message');
			expect(consoleOutput.log.length).toBe(1);

			MermaidValidator.CONFIG.DEBUG_MODE = true;
			MermaidValidator.log('info', 'Info message 2');
			expect(consoleOutput.log.length).toBe(2);

			// Reset
			MermaidValidator.CONFIG.DEBUG_MODE = false;
		});
	});

	describe('Integration with Requirements', () => {
		test('Requirement 7.1: should log detailed error information', () => {
			const errorContext = {
				type: 'ParseError',
				message: 'Invalid syntax',
				stack: 'Error stack trace',
				line: 5
			};

			MermaidValidator.log('error', 'Parsing failed', errorContext);

			expect(console.error).toHaveBeenCalled();
			expect(consoleOutput.error[0][0]).toContain('[ERROR]');
			expect(consoleOutput.error[0][0]).toContain('Parsing failed');
			expect(consoleOutput.error[0][1]).toEqual(errorContext);
		});

		test('Requirement 7.2: should include timestamp, level, message, and context', () => {
			const context = { userId: '123', action: 'generate' };
			MermaidValidator.log('info', 'User action', context);

			const logMessage = consoleOutput.log[0][0];
			
			// Check timestamp
			expect(logMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
			
			// Check level
			expect(logMessage).toContain('[INFO]');
			
			// Check message
			expect(logMessage).toContain('User action');
			
			// Check context
			expect(consoleOutput.log[0][1]).toEqual(context);
		});

		test('Requirement 7.3: should support debug mode switch', () => {
			// Debug mode off - debug logs should not appear
			MermaidValidator.CONFIG.DEBUG_MODE = false;
			MermaidValidator.log('debug', 'Debug log 1');
			expect(consoleOutput.log.length).toBe(0);

			// Debug mode on - debug logs should appear
			MermaidValidator.CONFIG.DEBUG_MODE = true;
			MermaidValidator.log('debug', 'Debug log 2');
			expect(consoleOutput.log.length).toBe(1);
			expect(consoleOutput.log[0][0]).toContain('[DEBUG]');
			expect(consoleOutput.log[0][0]).toContain('Debug log 2');

			// Reset
			MermaidValidator.CONFIG.DEBUG_MODE = false;
		});
	});

	describe('Property-Based Tests', () => {
		const fc = require('fast-check');

		/**
		 * Feature: mermaid-iframe-integration, Property 17: Error Log Completeness
		 * Validates: Requirements 7.1, 7.2
		 * 
		 * For any error that occurs during processing, the system should log complete
		 * error information including error type, error message, stack trace, and context.
		 */
		test('Property 17: Error logs should contain complete information', () => {
			fc.assert(
				fc.property(
					// Generate random error messages
					fc.string({ minLength: 1, maxLength: 100 }),
					// Generate random error contexts with various fields
					fc.record({
						type: fc.option(fc.constantFrom('ParseError', 'ValidationError', 'InsertError', 'TimeoutError'), { nil: undefined }),
						message: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }),
						stack: fc.option(fc.string({ minLength: 10, maxLength: 200 }), { nil: undefined }),
						line: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
						column: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
						code: fc.option(fc.constantFrom('ERR_001', 'ERR_002', 'ERR_003'), { nil: undefined }),
						details: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
					}, { requiredKeys: [] }),
					(errorMessage, errorContext) => {
						// Clear previous output
						consoleOutput.error = [];

						// Log the error
						MermaidValidator.log('error', errorMessage, errorContext);

						// Verify console.error was called
						if (console.error.mock.calls.length === 0) {
							return false;
						}

						// Get the logged output
						const loggedMessage = consoleOutput.error[0][0];
						const loggedContext = consoleOutput.error[0][1];

						// Property 1: Log message should contain timestamp in ISO format
						const hasTimestamp = /\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/.test(loggedMessage);
						if (!hasTimestamp) {
							return false;
						}

						// Property 2: Log message should contain error level
						if (!loggedMessage.includes('[ERROR]')) {
							return false;
						}

						// Property 3: Log message should contain the error message
						if (!loggedMessage.includes(errorMessage)) {
							return false;
						}

						// Property 4: Context should be preserved exactly as provided
						// If context was provided, it should be logged as the second argument
						if (Object.keys(errorContext).length > 0) {
							if (loggedContext === undefined) {
								return false;
							}
							// Verify all context fields are preserved
							for (const key in errorContext) {
								if (errorContext[key] !== undefined && loggedContext[key] !== errorContext[key]) {
									return false;
								}
							}
						}

						// Property 5: Log format should be consistent: [timestamp] [LEVEL] message
						const formatRegex = /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[ERROR\] .+$/;
						if (!formatRegex.test(loggedMessage)) {
							return false;
						}

						return true;
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * Additional property test: Error logs with Error objects
		 * Validates that native Error objects are properly logged with their stack traces
		 */
		test('Property 17a: Error logs should handle Error objects correctly', () => {
			fc.assert(
				fc.property(
					fc.string({ minLength: 1, maxLength: 100 }),
					fc.string({ minLength: 1, maxLength: 100 }),
					(errorMessage, errorDescription) => {
						// Clear previous output
						consoleOutput.error = [];

						// Create a native Error object
						const error = new Error(errorDescription);

						// Log the error
						MermaidValidator.log('error', errorMessage, error);

						// Verify console.error was called
						if (console.error.mock.calls.length === 0) {
							return false;
						}

						// Get the logged output
						const loggedMessage = consoleOutput.error[0][0];
						const loggedContext = consoleOutput.error[0][1];

						// Verify the error message is in the log
						if (!loggedMessage.includes(errorMessage)) {
							return false;
						}

						// Verify the Error object is preserved as context
						if (!(loggedContext instanceof Error)) {
							return false;
						}

						// Verify the Error object's message is preserved
						if (loggedContext.message !== errorDescription) {
							return false;
						}

						// Verify the Error object has a stack trace
						if (!loggedContext.stack) {
							return false;
						}

						return true;
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * Additional property test: All error levels should log complete information
		 * Validates that warn and info levels also maintain completeness
		 */
		test('Property 17b: All log levels should maintain information completeness', () => {
			fc.assert(
				fc.property(
					fc.constantFrom('error', 'warn', 'info'),
					fc.string({ minLength: 1, maxLength: 100 }),
					fc.record({
						operation: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
						duration: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
						status: fc.option(fc.constantFrom('success', 'failure', 'pending'), { nil: undefined })
					}, { requiredKeys: [] }),
					(level, message, context) => {
						// Clear previous output
						consoleOutput.error = [];
						consoleOutput.warn = [];
						consoleOutput.log = [];

						// Log the message
						MermaidValidator.log(level, message, context);

						// Get the appropriate output array
						let output;
						if (level === 'error') {
							output = consoleOutput.error;
						} else if (level === 'warn') {
							output = consoleOutput.warn;
						} else {
							output = consoleOutput.log;
						}

						// Verify logging occurred
						if (output.length === 0) {
							return false;
						}

						const loggedMessage = output[0][0];
						const loggedContext = output[0][1];

						// Verify timestamp
						if (!/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/.test(loggedMessage)) {
							return false;
						}

						// Verify level
						if (!loggedMessage.includes('[' + level.toUpperCase() + ']')) {
							return false;
						}

						// Verify message
						if (!loggedMessage.includes(message)) {
							return false;
						}

						// Verify context preservation
						if (Object.keys(context).length > 0 && loggedContext === undefined) {
							return false;
						}

						return true;
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * Feature: mermaid-iframe-integration, Property 18: Debug Log Controllability
		 * Validates: Requirements 7.3
		 * 
		 * For any successful operation, when debug mode is enabled, the system should log
		 * success messages; when debug mode is disabled, debug logs should not appear.
		 * Non-debug logs (error, warn, info) should always appear regardless of debug mode.
		 */
		test('Property 18: Debug logs should be controllable by DEBUG_MODE', () => {
			fc.assert(
				fc.property(
					// Generate random log levels
					fc.constantFrom('error', 'warn', 'info', 'debug'),
					// Generate random messages
					fc.string({ minLength: 1, maxLength: 100 }),
					// Generate random debug mode states
					fc.boolean(),
					// Generate random context
					fc.record({
						operation: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
						duration: fc.option(fc.integer({ min: 0, max: 10000 }), { nil: undefined }),
						result: fc.option(fc.constantFrom('success', 'failure'), { nil: undefined })
					}, { requiredKeys: [] }),
					(level, message, debugMode, context) => {
						// Clear previous output
						consoleOutput.error = [];
						consoleOutput.warn = [];
						consoleOutput.log = [];

						// Set debug mode
						MermaidValidator.CONFIG.DEBUG_MODE = debugMode;

						// Log the message
						MermaidValidator.log(level, message, context);

						// Get the appropriate output array
						let output;
						if (level === 'error') {
							output = consoleOutput.error;
						} else if (level === 'warn') {
							output = consoleOutput.warn;
						} else {
							output = consoleOutput.log;
						}

						// Property 1: Debug logs should only appear when DEBUG_MODE is true
						if (level === 'debug') {
							if (debugMode) {
								// Debug mode ON: debug logs should appear
								if (output.length === 0) {
									return false;
								}
								// Verify it's a debug log
								if (!output[0][0].includes('[DEBUG]')) {
									return false;
								}
							} else {
								// Debug mode OFF: debug logs should NOT appear
								if (output.length > 0) {
									return false;
								}
							}
						}

						// Property 2: Non-debug logs should always appear regardless of debug mode
						if (level !== 'debug') {
							if (output.length === 0) {
								return false;
							}
							// Verify the log level is correct
							if (!output[0][0].includes('[' + level.toUpperCase() + ']')) {
								return false;
							}
						}

						// Property 3: When logs do appear, they should contain the message
						if (output.length > 0) {
							if (!output[0][0].includes(message)) {
								return false;
							}
						}

						// Property 4: Context should be preserved when provided
						if (output.length > 0 && Object.keys(context).length > 0) {
							const loggedContext = output[0][1];
							if (loggedContext === undefined) {
								return false;
							}
						}

						return true;
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * Additional property test: Debug mode toggle behavior
		 * Validates that toggling debug mode affects only debug logs
		 */
		test('Property 18a: Toggling debug mode should only affect debug logs', () => {
			fc.assert(
				fc.property(
					fc.string({ minLength: 1, maxLength: 100 }),
					fc.record({
						info: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
					}, { requiredKeys: [] }),
					(message, context) => {
						// Test with debug mode OFF
						MermaidValidator.CONFIG.DEBUG_MODE = false;
						
						consoleOutput.error = [];
						consoleOutput.warn = [];
						consoleOutput.log = [];

						// Log all levels
						MermaidValidator.log('error', message, context);
						MermaidValidator.log('warn', message, context);
						MermaidValidator.log('info', message, context);
						MermaidValidator.log('debug', message, context);

						// Count logs with debug mode OFF
						const errorCountOff = consoleOutput.error.length;
						const warnCountOff = consoleOutput.warn.length;
						const infoCountOff = consoleOutput.log.length;
						const debugCountOff = consoleOutput.log.filter(log => 
							log[0].includes('[DEBUG]')
						).length;

						// Test with debug mode ON
						MermaidValidator.CONFIG.DEBUG_MODE = true;
						
						consoleOutput.error = [];
						consoleOutput.warn = [];
						consoleOutput.log = [];

						// Log all levels again
						MermaidValidator.log('error', message, context);
						MermaidValidator.log('warn', message, context);
						MermaidValidator.log('info', message, context);
						MermaidValidator.log('debug', message, context);

						// Count logs with debug mode ON
						const errorCountOn = consoleOutput.error.length;
						const warnCountOn = consoleOutput.warn.length;
						const infoCountOn = consoleOutput.log.filter(log => 
							log[0].includes('[INFO]')
						).length;
						const debugCountOn = consoleOutput.log.filter(log => 
							log[0].includes('[DEBUG]')
						).length;

						// Reset debug mode
						MermaidValidator.CONFIG.DEBUG_MODE = false;

						// Property 1: Error logs should be the same regardless of debug mode
						if (errorCountOff !== errorCountOn || errorCountOff !== 1) {
							return false;
						}

						// Property 2: Warn logs should be the same regardless of debug mode
						if (warnCountOff !== warnCountOn || warnCountOff !== 1) {
							return false;
						}

						// Property 3: Info logs should be the same regardless of debug mode
						if (infoCountOff !== infoCountOn || infoCountOff !== 1) {
							return false;
						}

						// Property 4: Debug logs should only appear when debug mode is ON
						if (debugCountOff !== 0) {
							return false;
						}
						if (debugCountOn !== 1) {
							return false;
						}

						return true;
					}
				),
				{ numRuns: 100 }
			);
		});

		/**
		 * Additional property test: Debug mode state independence
		 * Validates that debug mode state doesn't affect log format or content
		 */
		test('Property 18b: Debug mode should not affect log format or content', () => {
			fc.assert(
				fc.property(
					fc.constantFrom('error', 'warn', 'info'),
					fc.string({ minLength: 1, maxLength: 100 }),
					fc.boolean(),
					(level, message, debugMode) => {
						// Set debug mode
						MermaidValidator.CONFIG.DEBUG_MODE = debugMode;

						// Clear output
						consoleOutput.error = [];
						consoleOutput.warn = [];
						consoleOutput.log = [];

						// Log the message
						MermaidValidator.log(level, message);

						// Get the appropriate output
						let output;
						if (level === 'error') {
							output = consoleOutput.error;
						} else if (level === 'warn') {
							output = consoleOutput.warn;
						} else {
							output = consoleOutput.log;
						}

						// Property 1: Non-debug logs should always appear
						if (output.length === 0) {
							return false;
						}

						const loggedMessage = output[0][0];

						// Property 2: Log format should be consistent
						const formatRegex = /^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] \[.+\] .+$/;
						if (!formatRegex.test(loggedMessage)) {
							return false;
						}

						// Property 3: Message content should be preserved
						if (!loggedMessage.includes(message)) {
							return false;
						}

						// Property 4: Log level should be correct
						if (!loggedMessage.includes('[' + level.toUpperCase() + ']')) {
							return false;
						}

						return true;
					}
				),
				{ numRuns: 100 }
			);
		});
	});
});
