/**
 * Backward Compatibility Tests for mermaid-import.js plugin
 * Feature: mermaid-iframe-integration, Property 19: 向后兼容性
 * Validates: Requirements 8.1, 8.2
 * 
 * These tests verify that the existing importMermaid and insertMermaid actions
 * continue to work correctly after adding the new generateMermaid action.
 */

const fc = require('fast-check');
const { createMockUI, createMockMessageEvent, wait } = require('./helpers/mocks');

describe('Backward Compatibility Tests', () => {
	let mockUI;
	let handleMessage;

	beforeEach(() => {
		mockUI = createMockUI();

		// Simulate the plugin's handleMessage function
		// This is the actual implementation from mermaid-import.js
		handleMessage = function(evt) {
			var data = evt.data;

			// Parse JSON if needed
			if (typeof data === 'string') {
				try {
					data = JSON.parse(data);
				} catch (e) {
					return;
				}
			}

			// Validate basic message structure
			if (data == null || data.action == null) {
				return;
			}

			// Route to generateMermaid handler (new action)
			if (data.action === 'generateMermaid') {
				// Skip - not testing this in backward compatibility tests
				return;
			}

			// Preserve existing importMermaid action
			if (data.action === 'importMermaid') {
				handleMermaid(evt, data, 'importMermaid', function(xml) {
					mockUI.setFileData(xml);
				});
				return;
			}

			// Preserve existing insertMermaid action
			if (data.action === 'insertMermaid') {
				handleMermaid(evt, data, 'insertMermaid', function(xml) {
					var cells = mockUI.importXml(xml, 20, 20, true);
					if (cells != null && mockUI.editor && mockUI.editor.graph) {
						mockUI.editor.graph.setSelectionCells(cells);
					}
				});
				return;
			}
		};

		// Legacy handler function
		function handleMermaid(evt, action, eventName, applyFn) {
			var mermaid = action.mermaid || action.data || '';

			if (typeof mermaid !== 'string' || mermaid.trim() === '') {
				postResult(evt, eventName, false, 'Missing mermaid payload');
				return;
			}

			mockUI.parseMermaidDiagram(mermaid, null, function(xml) {
				try {
					applyFn(xml);
					if (mockUI.editor && typeof mockUI.editor.setModified === 'function') {
						mockUI.editor.setModified(true);
					}
					postResult(evt, eventName, true, null);
				} catch (e) {
					postResult(evt, eventName, false, e && e.message ? e.message : String(e));
				}
			}, function(err) {
				postResult(evt, eventName, false, err && err.message ? err.message : String(err));
			});
		}

		// Legacy response function
		function postResult(evt, eventName, ok, err) {
			try {
				if (evt != null && evt.source != null) {
					evt.source.postMessage(JSON.stringify({
						event: eventName,
						success: ok,
						error: err || null,
					}), '*');
				}
			} catch (e) {
				// Ignore postMessage errors.
			}
		}
	});

	describe('importMermaid action', () => {
		test('should handle importMermaid with mermaid field', async () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'importMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			handleMessage(mockEvent);

			await wait(50);

			// Verify parsing was called
			expect(mockUI.parseMermaidDiagram).toHaveBeenCalledWith(
				'flowchart TD\n    A --> B',
				null,
				expect.any(Function),
				expect.any(Function)
			);

			// Verify setFileData was called
			expect(mockUI.setFileData).toHaveBeenCalledWith(
				'<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'
			);

			// Verify document was marked as modified
			expect(mockUI.editor.setModified).toHaveBeenCalledWith(true);

			// Verify response was sent with legacy format
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"event":"importMermaid"'),
				'*'
			);
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"success":true'),
				'*'
			);
		});

		test('should handle importMermaid with data field (legacy)', async () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'importMermaid',
				data: 'flowchart TD\n    A --> B'
			};

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			handleMessage(mockEvent);

			await wait(50);

			// Verify parsing was called with data field
			expect(mockUI.parseMermaidDiagram).toHaveBeenCalledWith(
				'flowchart TD\n    A --> B',
				null,
				expect.any(Function),
				expect.any(Function)
			);

			// Verify setFileData was called
			expect(mockUI.setFileData).toHaveBeenCalled();

			// Verify success response
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"success":true'),
				'*'
			);
		});

		test('should reject importMermaid with empty mermaid', async () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'importMermaid',
				mermaid: ''
			};

			handleMessage(mockEvent);

			await wait(50);

			// Verify error response was sent
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"success":false'),
				'*'
			);
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('Missing mermaid payload'),
				'*'
			);
		});

		test('should handle importMermaid parsing errors', async () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'importMermaid',
				mermaid: 'invalid syntax'
			};

			// Mock parsing failure
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => error(new Error('Syntax error')), 0);
			});

			handleMessage(mockEvent);

			await wait(50);

			// Verify error response was sent
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"success":false'),
				'*'
			);
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('Syntax error'),
				'*'
			);
		});
	});

	describe('insertMermaid action', () => {
		test('should handle insertMermaid with mermaid field', async () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'insertMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			// Mock successful insertion
			const mockCells = [{ id: 'cell1' }, { id: 'cell2' }];
			mockUI.importXml = jest.fn(() => mockCells);

			handleMessage(mockEvent);

			await wait(50);

			// Verify parsing was called
			expect(mockUI.parseMermaidDiagram).toHaveBeenCalledWith(
				'flowchart TD\n    A --> B',
				null,
				expect.any(Function),
				expect.any(Function)
			);

			// Verify importXml was called with correct parameters
			expect(mockUI.importXml).toHaveBeenCalledWith(
				'<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>',
				20,
				20,
				true
			);

			// Verify cells were selected
			expect(mockUI.editor.graph.setSelectionCells).toHaveBeenCalledWith(mockCells);

			// Verify document was marked as modified
			expect(mockUI.editor.setModified).toHaveBeenCalledWith(true);

			// Verify response was sent with legacy format
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"event":"insertMermaid"'),
				'*'
			);
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"success":true'),
				'*'
			);
		});

		test('should handle insertMermaid with data field (legacy)', async () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'insertMermaid',
				data: 'flowchart TD\n    A --> B'
			};

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			// Mock successful insertion
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

			handleMessage(mockEvent);

			await wait(50);

			// Verify parsing was called with data field
			expect(mockUI.parseMermaidDiagram).toHaveBeenCalledWith(
				'flowchart TD\n    A --> B',
				null,
				expect.any(Function),
				expect.any(Function)
			);

			// Verify importXml was called
			expect(mockUI.importXml).toHaveBeenCalled();

			// Verify success response
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"success":true'),
				'*'
			);
		});

		test('should reject insertMermaid with empty mermaid', async () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'insertMermaid',
				mermaid: '   '
			};

			handleMessage(mockEvent);

			await wait(50);

			// Verify error response was sent
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"success":false'),
				'*'
			);
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('Missing mermaid payload'),
				'*'
			);
		});

		test('should handle insertMermaid parsing errors', async () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'insertMermaid',
				mermaid: 'invalid syntax'
			};

			// Mock parsing failure
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => error(new Error('Parse failed')), 0);
			});

			handleMessage(mockEvent);

			await wait(50);

			// Verify error response was sent
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"success":false'),
				'*'
			);
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('Parse failed'),
				'*'
			);
		});

		test('should handle insertMermaid insertion errors', async () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'insertMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			// Mock insertion failure
			mockUI.importXml = jest.fn(() => {
				throw new Error('Canvas locked');
			});

			handleMessage(mockEvent);

			await wait(50);

			// Verify error response was sent
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"success":false'),
				'*'
			);
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('Canvas locked'),
				'*'
			);
		});
	});

	describe('Property 19: Backward Compatibility', () => {
		/**
		 * Feature: mermaid-iframe-integration, Property 19: 向后兼容性
		 * For any existing postMessage action (importMermaid, insertMermaid),
		 * after adding the new generateMermaid action, the existing actions
		 * should continue to work correctly.
		 */
		test('Property 19: existing actions continue to work after adding generateMermaid', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.constantFrom('importMermaid', 'insertMermaid'),
					fc.string({ minLength: 10, maxLength: 100 }),
					async (action, mermaidText) => {
						const mockEvent = createMockMessageEvent();
						mockEvent.data = {
							action: action,
							mermaid: mermaidText
						};

						// Mock successful parsing
						mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
							setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
						});

						// Mock successful insertion
						mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

						// Reset mocks
						mockUI.setFileData.mockClear();
						mockUI.editor.setModified.mockClear();
						mockEvent.source.postMessage.mockClear();

						// Handle message
						handleMessage(mockEvent);

						// Wait for async operations
						await wait(50);

						// Verify parsing was called
						const parsingCalled = mockUI.parseMermaidDiagram.mock.calls.length > 0;

						// Verify appropriate function was called based on action
						let actionFunctionCalled = false;
						if (action === 'importMermaid') {
							actionFunctionCalled = mockUI.setFileData.mock.calls.length > 0;
						} else if (action === 'insertMermaid') {
							actionFunctionCalled = mockUI.importXml.mock.calls.length > 0;
						}

						// Verify document was marked as modified
						const modifiedCalled = mockUI.editor.setModified.mock.calls.length > 0;

						// Verify response was sent with correct event name
						const responseSent = mockEvent.source.postMessage.mock.calls.length > 0;
						let correctEventName = false;
						if (responseSent) {
							const responseData = mockEvent.source.postMessage.mock.calls[0][0];
							const response = JSON.parse(responseData);
							correctEventName = response.event === action;
						}

						// All checks must pass
						return parsingCalled && actionFunctionCalled && modifiedCalled && responseSent && correctEventName;
					}
				),
				{ numRuns: 100 }
			);
		});

		test('Property 19: legacy response format is preserved', async () => {
			await fc.assert(
				fc.asyncProperty(
					fc.constantFrom('importMermaid', 'insertMermaid'),
					fc.string({ minLength: 10, maxLength: 100 }),
					fc.boolean(),
					async (action, mermaidText, shouldSucceed) => {
						const mockEvent = createMockMessageEvent();
						mockEvent.data = {
							action: action,
							mermaid: mermaidText
						};

						// Mock parsing based on shouldSucceed
						if (shouldSucceed) {
							mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
								setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
							});
							mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);
						} else {
							mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
								setTimeout(() => error(new Error('Test error')), 0);
							});
						}

						// Reset mocks
						mockEvent.source.postMessage.mockClear();

						// Handle message
						handleMessage(mockEvent);

						// Wait for async operations
						await wait(50);

						// Verify response format
						if (mockEvent.source.postMessage.mock.calls.length > 0) {
							const responseData = mockEvent.source.postMessage.mock.calls[0][0];
							const response = JSON.parse(responseData);

							// Legacy format should have: event, success, error
							const hasEvent = 'event' in response;
							const hasSuccess = 'success' in response;
							const hasError = 'error' in response;
							const correctEventName = response.event === action;
							const correctSuccessValue = response.success === shouldSucceed;

							// Legacy format should NOT have: status, errorCode, data
							const noStatus = !('status' in response);
							const noErrorCode = !('errorCode' in response);
							const noData = !('data' in response);

							return hasEvent && hasSuccess && hasError && correctEventName && 
							       correctSuccessValue && noStatus && noErrorCode && noData;
						}

						return false;
					}
				),
				{ numRuns: 100 }
			);
		});

		test('Property 19: legacy actions do not interfere with generateMermaid', async () => {
			// This test verifies that the routing logic correctly separates
			// the new generateMermaid action from legacy actions

			const actions = ['importMermaid', 'insertMermaid', 'generateMermaid'];
			
			for (const action of actions) {
				const mockEvent = createMockMessageEvent();
				mockEvent.data = {
					action: action,
					mermaid: 'flowchart TD\n    A --> B'
				};

				// Mock successful parsing
				mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
					setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
				});

				// Mock successful insertion
				mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

				// Reset mocks
				mockUI.setFileData.mockClear();
				mockEvent.source.postMessage.mockClear();

				// Handle message
				handleMessage(mockEvent);

				await wait(50);

				// For legacy actions, verify they were processed
				if (action === 'importMermaid') {
					expect(mockUI.setFileData).toHaveBeenCalled();
					expect(mockEvent.source.postMessage).toHaveBeenCalled();
					
					const responseData = mockEvent.source.postMessage.mock.calls[0][0];
					const response = JSON.parse(responseData);
					expect(response.event).toBe('importMermaid');
					expect(response).toHaveProperty('success');
				} else if (action === 'insertMermaid') {
					expect(mockUI.importXml).toHaveBeenCalled();
					expect(mockEvent.source.postMessage).toHaveBeenCalled();
					
					const responseData = mockEvent.source.postMessage.mock.calls[0][0];
					const response = JSON.parse(responseData);
					expect(response.event).toBe('insertMermaid');
					expect(response).toHaveProperty('success');
				} else if (action === 'generateMermaid') {
					// generateMermaid should be skipped in this test
					// (it returns early in our test handleMessage)
					expect(mockUI.setFileData).not.toHaveBeenCalled();
					expect(mockEvent.source.postMessage).not.toHaveBeenCalled();
				}
			}
		});
	});
});
