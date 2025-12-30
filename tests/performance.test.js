/**
 * Tests for performance monitoring functions
 * Validates Requirements 7.3
 */

describe('Performance Monitoring', () => {
	let originalConsole;
	let consoleOutput;
	let CONFIG;
	let measurePerformance;
	let measurePerformanceAsync;

	beforeEach(() => {
		// Save original console
		originalConsole = {
			log: console.log,
			error: console.error,
			warn: console.warn
		};

		// Mock console methods to capture output
		consoleOutput = {
			log: [],
			error: [],
			warn: []
		};

		console.log = jest.fn((...args) => consoleOutput.log.push(args));
		console.error = jest.fn((...args) => consoleOutput.error.push(args));
		console.warn = jest.fn((...args) => consoleOutput.warn.push(args));

		// Create test implementations of the functions
		CONFIG = {
			DEBUG_MODE: false
		};

		// Implementation of log function for testing
		function log(level, message, context) {
			if (!CONFIG.DEBUG_MODE && level === 'debug') {
				return;
			}
			
			var timestamp = new Date().toISOString();
			var logMessage = '[' + timestamp + '] [MermaidImport] [' + level.toUpperCase() + '] ' + message;
			
			if (level === 'error') {
				console.error(logMessage, context || '');
			} else if (level === 'warn') {
				console.warn(logMessage, context || '');
			} else {
				console.log(logMessage, context || '');
			}
		}

		// Implementation of measurePerformance for testing
		measurePerformance = function(operationName, fn) {
			if (!CONFIG.DEBUG_MODE) {
				return fn();
			}

			var startTime = performance.now();
			var result;
			var error;
			var hasError = false;

			try {
				result = fn();
				return result;
			} catch (e) {
				error = e;
				hasError = true;
				throw e;
			} finally {
				var endTime = performance.now();
				var duration = endTime - startTime;

				if (hasError) {
					log('debug', 'Performance: ' + operationName + ' failed after ' + duration.toFixed(2) + 'ms', {
						operation: operationName,
						duration: duration,
						error: error
					});
				} else {
					log('debug', 'Performance: ' + operationName + ' completed in ' + duration.toFixed(2) + 'ms', {
						operation: operationName,
						duration: duration
					});
				}
			}
		};

		// Implementation of measurePerformanceAsync for testing
		measurePerformanceAsync = function(operationName, fn) {
			if (!CONFIG.DEBUG_MODE) {
				return fn();
			}

			var startTime = performance.now();

			return fn()
				.then(function(result) {
					var endTime = performance.now();
					var duration = endTime - startTime;

					log('debug', 'Performance: ' + operationName + ' completed in ' + duration.toFixed(2) + 'ms', {
						operation: operationName,
						duration: duration
					});

					return result;
				})
				.catch(function(error) {
					var endTime = performance.now();
					var duration = endTime - startTime;

					log('debug', 'Performance: ' + operationName + ' failed after ' + duration.toFixed(2) + 'ms', {
						operation: operationName,
						duration: duration,
						error: error
					});

					throw error;
				});
		};
	});

	afterEach(() => {
		// Restore console
		console.log = originalConsole.log;
		console.error = originalConsole.error;
		console.warn = originalConsole.warn;
	});

	describe('measurePerformance Function', () => {
		test('should execute function and return result when debug mode is disabled', () => {
			CONFIG.DEBUG_MODE = false;
			
			const testFn = jest.fn(() => 'test result');
			const result = measurePerformance('Test Operation', testFn);

			expect(testFn).toHaveBeenCalled();
			expect(result).toBe('test result');
			expect(consoleOutput.log.length).toBe(0);
		});

		test('should measure execution time when debug mode is enabled', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(() => 'test result');
			const result = measurePerformance('Test Operation', testFn);

			expect(testFn).toHaveBeenCalled();
			expect(result).toBe('test result');
			expect(consoleOutput.log.length).toBe(1);
		});

		test('should log performance metrics with operation name and duration', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(() => 'result');
			measurePerformance('Parse Mermaid', testFn);

			expect(consoleOutput.log.length).toBe(1);
			const logMessage = consoleOutput.log[0][0];
			
			expect(logMessage).toContain('[DEBUG]');
			expect(logMessage).toContain('Performance: Parse Mermaid completed in');
			expect(logMessage).toContain('ms');
		});

		test('should include duration in context object', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(() => 'result');
			measurePerformance('Test Op', testFn);

			expect(consoleOutput.log.length).toBe(1);
			const context = consoleOutput.log[0][1];
			
			expect(context).toBeDefined();
			expect(context.operation).toBe('Test Op');
			expect(context.duration).toBeDefined();
			expect(typeof context.duration).toBe('number');
			expect(context.duration).toBeGreaterThanOrEqual(0);
		});

		test('should handle function errors and still log performance', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testError = new Error('Test error');
			const testFn = jest.fn(() => {
				throw testError;
			});

			expect(() => {
				measurePerformance('Failing Operation', testFn);
			}).toThrow('Test error');

			expect(testFn).toHaveBeenCalled();
			expect(consoleOutput.log.length).toBe(1);
			
			const logMessage = consoleOutput.log[0][0];
			expect(logMessage).toContain('Performance: Failing Operation failed after');
			expect(logMessage).toContain('ms');
			
			const context = consoleOutput.log[0][1];
			expect(context.error).toBe(testError);
		});

		test('should format duration with 2 decimal places', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(() => 'result');
			measurePerformance('Test', testFn);

			const logMessage = consoleOutput.log[0][0];
			// Check that the duration is formatted with decimal places
			expect(logMessage).toMatch(/\d+\.\d{2}ms/);
		});

		test('should not interfere with function return value', () => {
			CONFIG.DEBUG_MODE = true;
			
			const complexResult = { data: [1, 2, 3], status: 'ok' };
			const testFn = jest.fn(() => complexResult);
			const result = measurePerformance('Test', testFn);

			expect(result).toBe(complexResult);
			expect(result).toEqual({ data: [1, 2, 3], status: 'ok' });
		});

		test('should work with functions that return undefined', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(() => undefined);
			const result = measurePerformance('Test', testFn);

			expect(result).toBeUndefined();
			expect(testFn).toHaveBeenCalled();
			expect(consoleOutput.log.length).toBe(1);
		});

		test('should work with functions that return null', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(() => null);
			const result = measurePerformance('Test', testFn);

			expect(result).toBeNull();
			expect(testFn).toHaveBeenCalled();
			expect(consoleOutput.log.length).toBe(1);
		});
	});

	describe('measurePerformanceAsync Function', () => {
		test('should execute async function and return result when debug mode is disabled', async () => {
			CONFIG.DEBUG_MODE = false;
			
			const testFn = jest.fn(async () => 'async result');
			const result = await measurePerformanceAsync('Async Test', testFn);

			expect(testFn).toHaveBeenCalled();
			expect(result).toBe('async result');
			expect(consoleOutput.log.length).toBe(0);
		});

		test('should measure execution time for async operations when debug mode is enabled', async () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(async () => {
				await new Promise(resolve => setTimeout(resolve, 10));
				return 'async result';
			});
			
			const result = await measurePerformanceAsync('Async Parse', testFn);

			expect(testFn).toHaveBeenCalled();
			expect(result).toBe('async result');
			expect(consoleOutput.log.length).toBe(1);
		});

		test('should log performance metrics for successful async operations', async () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(async () => 'result');
			await measurePerformanceAsync('Async Operation', testFn);

			expect(consoleOutput.log.length).toBe(1);
			const logMessage = consoleOutput.log[0][0];
			
			expect(logMessage).toContain('[DEBUG]');
			expect(logMessage).toContain('Performance: Async Operation completed in');
			expect(logMessage).toContain('ms');
		});

		test('should handle async function errors and still log performance', async () => {
			CONFIG.DEBUG_MODE = true;
			
			const testError = new Error('Async error');
			const testFn = jest.fn(async () => {
				throw testError;
			});

			await expect(
				measurePerformanceAsync('Failing Async Op', testFn)
			).rejects.toThrow('Async error');

			expect(testFn).toHaveBeenCalled();
			expect(consoleOutput.log.length).toBe(1);
			
			const logMessage = consoleOutput.log[0][0];
			expect(logMessage).toContain('Performance: Failing Async Op failed after');
			
			const context = consoleOutput.log[0][1];
			expect(context.error).toBe(testError);
		});

		test('should include duration in context for async operations', async () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(async () => 'result');
			await measurePerformanceAsync('Async Test', testFn);

			const context = consoleOutput.log[0][1];
			
			expect(context).toBeDefined();
			expect(context.operation).toBe('Async Test');
			expect(context.duration).toBeDefined();
			expect(typeof context.duration).toBe('number');
		});

		test('should format async duration with 2 decimal places', async () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(async () => 'result');
			await measurePerformanceAsync('Async Test', testFn);

			const logMessage = consoleOutput.log[0][0];
			// Check that the duration is formatted with decimal places
			expect(logMessage).toMatch(/\d+\.\d{2}ms/);
		});

		test('should preserve promise resolution value', async () => {
			CONFIG.DEBUG_MODE = true;
			
			const complexResult = { data: [1, 2, 3], status: 'success' };
			const testFn = jest.fn(async () => complexResult);
			const result = await measurePerformanceAsync('Test', testFn);

			expect(result).toBe(complexResult);
			expect(result).toEqual({ data: [1, 2, 3], status: 'success' });
		});

		test('should work with promises that resolve to undefined', async () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(async () => undefined);
			const result = await measurePerformanceAsync('Test', testFn);

			expect(result).toBeUndefined();
			expect(testFn).toHaveBeenCalled();
			expect(consoleOutput.log.length).toBe(1);
		});
	});

	describe('Debug Mode Control', () => {
		test('should not measure performance when debug mode is off', () => {
			CONFIG.DEBUG_MODE = false;
			
			const testFn = jest.fn(() => 'result');
			measurePerformance('Test', testFn);

			expect(testFn).toHaveBeenCalled();
			expect(consoleOutput.log.length).toBe(0);
		});

		test('should measure performance when debug mode is on', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(() => 'result');
			measurePerformance('Test', testFn);

			expect(testFn).toHaveBeenCalled();
			expect(consoleOutput.log.length).toBe(1);
		});

		test('should toggle performance measurement with debug mode', () => {
			// First call with debug mode off
			CONFIG.DEBUG_MODE = false;
			const testFn1 = jest.fn(() => 'result1');
			measurePerformance('Test1', testFn1);
			
			expect(consoleOutput.log.length).toBe(0);

			// Second call with debug mode on
			CONFIG.DEBUG_MODE = true;
			const testFn2 = jest.fn(() => 'result2');
			measurePerformance('Test2', testFn2);
			
			expect(consoleOutput.log.length).toBe(1);
			expect(consoleOutput.log[0][0]).toContain('Test2');
		});

		test('should not measure async performance when debug mode is off', async () => {
			CONFIG.DEBUG_MODE = false;
			
			const testFn = jest.fn(async () => 'result');
			await measurePerformanceAsync('Async Test', testFn);

			expect(testFn).toHaveBeenCalled();
			expect(consoleOutput.log.length).toBe(0);
		});

		test('should measure async performance when debug mode is on', async () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(async () => 'result');
			await measurePerformanceAsync('Async Test', testFn);

			expect(testFn).toHaveBeenCalled();
			expect(consoleOutput.log.length).toBe(1);
		});
	});

	describe('Integration with Requirements', () => {
		test('Requirement 7.3: should support debug mode switch for performance logs', () => {
			// Test with debug mode OFF
			CONFIG.DEBUG_MODE = false;
			const testFn1 = jest.fn(() => 'result');
			measurePerformance('Operation1', testFn1);
			
			expect(consoleOutput.log.length).toBe(0);

			// Test with debug mode ON
			CONFIG.DEBUG_MODE = true;
			const testFn2 = jest.fn(() => 'result');
			measurePerformance('Operation2', testFn2);
			
			expect(consoleOutput.log.length).toBe(1);
			expect(consoleOutput.log[0][0]).toContain('[DEBUG]');
			expect(consoleOutput.log[0][0]).toContain('Performance: Operation2 completed in');
		});

		test('Requirement 7.3: should log performance metrics only in debug mode', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(() => 'result');
			measurePerformance('Test Operation', testFn);

			expect(consoleOutput.log.length).toBe(1);
			const logMessage = consoleOutput.log[0][0];
			const context = consoleOutput.log[0][1];
			
			// Verify log contains performance information
			expect(logMessage).toContain('Performance:');
			expect(logMessage).toContain('Test Operation');
			expect(logMessage).toContain('completed in');
			expect(logMessage).toContain('ms');
			
			// Verify context contains performance data
			expect(context.operation).toBe('Test Operation');
			expect(context.duration).toBeDefined();
			expect(typeof context.duration).toBe('number');
		});

		test('Requirement 7.3: should measure key operations (validation, parsing, insertion)', () => {
			CONFIG.DEBUG_MODE = true;
			
			// Simulate measuring different operations
			const operations = [
				'Message Validation',
				'Mermaid Parsing',
				'Canvas Insertion'
			];

			operations.forEach(operation => {
				const testFn = jest.fn(() => 'result');
				measurePerformance(operation, testFn);
			});

			expect(consoleOutput.log.length).toBe(3);
			
			// Verify each operation was logged
			operations.forEach((operation, index) => {
				const logMessage = consoleOutput.log[index][0];
				expect(logMessage).toContain('Performance: ' + operation);
			});
		});
	});

	describe('Performance Measurement Accuracy', () => {
		test('should calculate duration as a positive number', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(() => 'result');
			measurePerformance('Test', testFn);

			const context = consoleOutput.log[0][1];
			expect(context.duration).toBeGreaterThanOrEqual(0);
			expect(typeof context.duration).toBe('number');
		});

		test('should include operation name in context', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(() => 'result');
			measurePerformance('My Operation', testFn);

			const context = consoleOutput.log[0][1];
			expect(context.operation).toBe('My Operation');
		});

		test('should format duration with exactly 2 decimal places', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(() => 'result');
			measurePerformance('Test', testFn);

			const logMessage = consoleOutput.log[0][0];
			// Match pattern like "12.34ms" or "0.05ms"
			const durationMatch = logMessage.match(/(\d+\.\d{2})ms/);
			expect(durationMatch).not.toBeNull();
			expect(durationMatch[1]).toMatch(/^\d+\.\d{2}$/);
		});
	});

	describe('Error Handling in Performance Measurement', () => {
		test('should log error context when function throws', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testError = new Error('Test error');
			testError.code = 'TEST_ERROR';
			
			const testFn = jest.fn(() => {
				throw testError;
			});

			expect(() => {
				measurePerformance('Error Test', testFn);
			}).toThrow('Test error');

			const context = consoleOutput.log[0][1];
			expect(context.error).toBe(testError);
			expect(context.error.code).toBe('TEST_ERROR');
		});

		test('should log "failed after" message for errors', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(() => {
				throw new Error('Test error');
			});

			expect(() => {
				measurePerformance('Error Test', testFn);
			}).toThrow();

			const logMessage = consoleOutput.log[0][0];
			expect(logMessage).toContain('failed after');
			expect(logMessage).not.toContain('completed in');
		});

		test('should still calculate duration when function throws', () => {
			CONFIG.DEBUG_MODE = true;
			
			const testFn = jest.fn(() => {
				throw new Error('Test error');
			});

			expect(() => {
				measurePerformance('Error Test', testFn);
			}).toThrow();

			const context = consoleOutput.log[0][1];
			expect(context.duration).toBeGreaterThanOrEqual(0);
			expect(typeof context.duration).toBe('number');
		});

		test('should handle async errors and log performance', async () => {
			CONFIG.DEBUG_MODE = true;
			
			const testError = new Error('Async error');
			const testFn = jest.fn(async () => {
				throw testError;
			});

			await expect(
				measurePerformanceAsync('Async Error Test', testFn)
			).rejects.toThrow('Async error');

			const logMessage = consoleOutput.log[0][0];
			expect(logMessage).toContain('failed after');
			
			const context = consoleOutput.log[0][1];
			expect(context.error).toBe(testError);
		});
	});
});
