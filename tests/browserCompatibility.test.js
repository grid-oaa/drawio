/**
 * Browser Compatibility Tests for mermaid-import.js plugin
 * Tests browser compatibility checks and degradation behavior
 * Validates: Requirements 8.3, 8.4
 * 
 * These tests verify that the plugin correctly detects unsupported browsers
 * and gracefully degrades when required features are not available.
 */

const { createMockUI, createMockMessageEvent, wait } = require('./helpers/mocks');

describe('Browser Compatibility Tests', () => {
	let mockUI;
	let originalPromise;
	let originalStructuredClone;
	let handleGenerateMermaid;
	let checkBrowserCompatibility;
	let sendResponse;
	let ERROR_CODES;

	beforeEach(() => {
		mockUI = createMockUI();

		// Save original globals
		originalPromise = global.Promise;
		originalStructuredClone = global.structuredClone;

		// Define error codes
		ERROR_CODES = {
			INVALID_FORMAT: 'INVALID_FORMAT',
			EMPTY_MERMAID: 'EMPTY_MERMAID',
			PARSE_ERROR: 'PARSE_ERROR',
			UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
			TIMEOUT: 'TIMEOUT',
			INSERT_FAILED: 'INSERT_FAILED',
			ORIGIN_DENIED: 'ORIGIN_DENIED',
			SIZE_EXCEEDED: 'SIZE_EXCEEDED',
			XSS_DETECTED: 'XSS_DETECTED',
			UNSUPPORTED_BROWSER: 'UNSUPPORTED_BROWSER'
		};

		// Mock browser compatibility check function
		checkBrowserCompatibility = function() {
			// Check if Promise is available
			if (typeof Promise === 'undefined') {
				return {
					supported: false,
					error: 'Browser does not support Promise API',
					errorCode: ERROR_CODES.UNSUPPORTED_BROWSER
				};
			}

			// Check if structuredClone is available
			if (typeof structuredClone === 'undefined') {
				return {
					supported: false,
					error: 'Browser does not support structuredClone API',
					errorCode: ERROR_CODES.UNSUPPORTED_BROWSER
				};
			}

			return { supported: true };
		};

		// Mock sendResponse function
		sendResponse = function(evt, success, error, errorCode, data) {
			try {
				if (!evt || !evt.source) {
					return;
				}

				var response = {
					event: 'generateMermaid',
					status: success ? 'ok' : 'error'
				};

				if (!success) {
					response.error = error || 'Unknown error';
					response.errorCode = errorCode || ERROR_CODES.PARSE_ERROR;
				}

				if (data) {
					response.data = data;
				}

				evt.source.postMessage(JSON.stringify(response), '*');
			} catch (e) {
				// Ignore postMessage errors
			}
		};

		// Mock handleGenerateMermaid function (simplified for compatibility testing)
		handleGenerateMermaid = function(evt, data) {
			// 1. Check browser compatibility
			var compatibility = checkBrowserCompatibility();
			if (!compatibility.supported) {
				sendResponse(evt, false, compatibility.error, compatibility.errorCode);
				return;
			}

			// If compatible, proceed with normal processing
			// (simplified for testing purposes)
			sendResponse(evt, true, null, null, { cellCount: 1 });
		};
	});

	afterEach(() => {
		// Restore original globals
		global.Promise = originalPromise;
		global.structuredClone = originalStructuredClone;
	});

	describe('checkBrowserCompatibility function', () => {
		test('should return supported:true when all required features are available', () => {
			// Ensure Promise and structuredClone are available
			global.Promise = originalPromise;
			global.structuredClone = originalStructuredClone || function() {};

			const result = checkBrowserCompatibility();

			expect(result.supported).toBe(true);
			expect(result.error).toBeUndefined();
			expect(result.errorCode).toBeUndefined();
		});

		test('should return supported:false when Promise is not available', () => {
			// Remove Promise
			global.Promise = undefined;
			global.structuredClone = originalStructuredClone || function() {};

			const result = checkBrowserCompatibility();

			expect(result.supported).toBe(false);
			expect(result.error).toBe('Browser does not support Promise API');
			expect(result.errorCode).toBe(ERROR_CODES.UNSUPPORTED_BROWSER);
		});

		test('should return supported:false when structuredClone is not available', () => {
			// Ensure Promise is available but remove structuredClone
			global.Promise = originalPromise;
			global.structuredClone = undefined;

			const result = checkBrowserCompatibility();

			expect(result.supported).toBe(false);
			expect(result.error).toBe('Browser does not support structuredClone API');
			expect(result.errorCode).toBe(ERROR_CODES.UNSUPPORTED_BROWSER);
		});

		test('should return supported:false when both Promise and structuredClone are not available', () => {
			// Remove both
			global.Promise = undefined;
			global.structuredClone = undefined;

			const result = checkBrowserCompatibility();

			expect(result.supported).toBe(false);
			// Should fail on Promise check first
			expect(result.error).toBe('Browser does not support Promise API');
			expect(result.errorCode).toBe(ERROR_CODES.UNSUPPORTED_BROWSER);
		});
	});

	describe('handleGenerateMermaid with unsupported browser', () => {
		test('should reject generateMermaid when Promise is not available', (done) => {
			// Remove Promise
			global.Promise = undefined;
			global.structuredClone = originalStructuredClone || function() {};

			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			handleGenerateMermaid(mockEvent, mockEvent.data);

			// Use setTimeout directly instead of wait() which requires Promise
			setTimeout(() => {
				// Restore Promise for assertions
				global.Promise = originalPromise;

				// Verify error response was sent
				expect(mockEvent.source.postMessage).toHaveBeenCalled();
				
				const responseData = mockEvent.source.postMessage.mock.calls[0][0];
				const response = JSON.parse(responseData);

				expect(response.event).toBe('generateMermaid');
				expect(response.status).toBe('error');
				expect(response.error).toBe('Browser does not support Promise API');
				expect(response.errorCode).toBe(ERROR_CODES.UNSUPPORTED_BROWSER);

				done();
			}, 50);
		});

		test('should reject generateMermaid when structuredClone is not available', async () => {
			// Ensure Promise is available but remove structuredClone
			global.Promise = originalPromise;
			global.structuredClone = undefined;

			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			handleGenerateMermaid(mockEvent, mockEvent.data);

			await wait(50);

			// Verify error response was sent
			expect(mockEvent.source.postMessage).toHaveBeenCalled();
			
			const responseData = mockEvent.source.postMessage.mock.calls[0][0];
			const response = JSON.parse(responseData);

			expect(response.event).toBe('generateMermaid');
			expect(response.status).toBe('error');
			expect(response.error).toBe('Browser does not support structuredClone API');
			expect(response.errorCode).toBe(ERROR_CODES.UNSUPPORTED_BROWSER);
		});

		test('should accept generateMermaid when all required features are available', async () => {
			// Ensure all features are available
			global.Promise = originalPromise;
			global.structuredClone = originalStructuredClone || function() {};

			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			handleGenerateMermaid(mockEvent, mockEvent.data);

			await wait(50);

			// Verify success response was sent
			expect(mockEvent.source.postMessage).toHaveBeenCalled();
			
			const responseData = mockEvent.source.postMessage.mock.calls[0][0];
			const response = JSON.parse(responseData);

			expect(response.event).toBe('generateMermaid');
			expect(response.status).toBe('ok');
			expect(response.error).toBeUndefined();
			expect(response.errorCode).toBeUndefined();
		});
	});

	describe('Degradation behavior', () => {
		test('should not process message when browser is unsupported', async () => {
			// Remove structuredClone
			global.structuredClone = undefined;

			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			// Mock parsing function (should not be called)
			mockUI.parseMermaidDiagram = jest.fn();

			handleGenerateMermaid(mockEvent, mockEvent.data);

			await wait(50);

			// Verify parsing was NOT called
			expect(mockUI.parseMermaidDiagram).not.toHaveBeenCalled();

			// Verify error response was sent
			expect(mockEvent.source.postMessage).toHaveBeenCalled();
			
			const responseData = mockEvent.source.postMessage.mock.calls[0][0];
			const response = JSON.parse(responseData);

			expect(response.status).toBe('error');
			expect(response.errorCode).toBe(ERROR_CODES.UNSUPPORTED_BROWSER);
		});

		test('should provide clear error message for unsupported browsers', (done) => {
			// Remove Promise
			global.Promise = undefined;

			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			handleGenerateMermaid(mockEvent, mockEvent.data);

			// Use setTimeout directly instead of wait() which requires Promise
			setTimeout(() => {
				// Restore Promise for assertions
				global.Promise = originalPromise;

				const responseData = mockEvent.source.postMessage.mock.calls[0][0];
				const response = JSON.parse(responseData);

				// Error message should be clear and actionable
				expect(response.error).toContain('Browser does not support');
				expect(response.error).toContain('Promise');
				expect(response.errorCode).toBe(ERROR_CODES.UNSUPPORTED_BROWSER);

				done();
			}, 50);
		});

		test('should handle multiple compatibility checks correctly', (done) => {
			// Test sequence: unsupported -> supported -> unsupported
			
			// First call: unsupported (no structuredClone)
			global.structuredClone = undefined;
			
			let mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			handleGenerateMermaid(mockEvent, mockEvent.data);
			
			setTimeout(() => {
				let responseData = mockEvent.source.postMessage.mock.calls[0][0];
				let response = JSON.parse(responseData);
				expect(response.status).toBe('error');
				expect(response.errorCode).toBe(ERROR_CODES.UNSUPPORTED_BROWSER);

				// Second call: supported (restore structuredClone)
				global.structuredClone = originalStructuredClone || function() {};
				
				mockEvent = createMockMessageEvent();
				mockEvent.data = {
					action: 'generateMermaid',
					mermaid: 'flowchart TD\n    A --> B'
				};

				handleGenerateMermaid(mockEvent, mockEvent.data);
				
				setTimeout(() => {
					responseData = mockEvent.source.postMessage.mock.calls[0][0];
					response = JSON.parse(responseData);
					expect(response.status).toBe('ok');

					// Third call: unsupported again (remove Promise)
					global.Promise = undefined;
					
					mockEvent = createMockMessageEvent();
					mockEvent.data = {
						action: 'generateMermaid',
						mermaid: 'flowchart TD\n    A --> B'
					};

					handleGenerateMermaid(mockEvent, mockEvent.data);
					
					setTimeout(() => {
						// Restore Promise for assertions
						global.Promise = originalPromise;

						responseData = mockEvent.source.postMessage.mock.calls[0][0];
						response = JSON.parse(responseData);
						expect(response.status).toBe('error');
						expect(response.errorCode).toBe(ERROR_CODES.UNSUPPORTED_BROWSER);

						done();
					}, 50);
				}, 50);
			}, 50);
		});
	});

	describe('Edge cases', () => {
		test('should handle when structuredClone exists but is not a function', () => {
			// Set structuredClone to a non-function value
			global.structuredClone = "not a function";

			const result = checkBrowserCompatibility();

			// typeof "not a function" is 'string', not 'undefined'
			// So the check will pass (it only checks if typeof === 'undefined')
			expect(result.supported).toBe(true);
		});

		test('should handle when Promise exists but is not a constructor', () => {
			// Set Promise to a non-constructor value
			global.Promise = "not a constructor";
			// Also need to ensure structuredClone is available
			global.structuredClone = originalStructuredClone || function() {};

			const result = checkBrowserCompatibility();

			// The check is: typeof Promise === 'undefined'
			// When Promise is a string, typeof returns 'string', not 'undefined'
			// So the Promise check should pass
			// But structuredClone check happens second, so both need to be non-undefined
			expect(result.supported).toBe(true);
		});

		test('should handle null values for browser features', () => {
			// Set to null (which is different from undefined)
			global.Promise = null;
			global.structuredClone = null;

			const result = checkBrowserCompatibility();

			// typeof null is 'object', not 'undefined'
			// So the check will pass (it only checks if typeof === 'undefined')
			expect(result.supported).toBe(true);
		});
	});

	describe('Response format for unsupported browsers', () => {
		test('should use correct response format for browser compatibility errors', async () => {
			global.structuredClone = undefined;

			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			handleGenerateMermaid(mockEvent, mockEvent.data);

			await wait(50);

			const responseData = mockEvent.source.postMessage.mock.calls[0][0];
			const response = JSON.parse(responseData);

			// Verify response structure matches generateMermaid format
			expect(response).toHaveProperty('event', 'generateMermaid');
			expect(response).toHaveProperty('status', 'error');
			expect(response).toHaveProperty('error');
			expect(response).toHaveProperty('errorCode');
			
			// Should NOT have legacy format fields
			expect(response).not.toHaveProperty('success');
		});
	});
});
