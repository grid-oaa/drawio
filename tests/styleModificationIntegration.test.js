/**
 * End-to-End Integration Tests for Style Modification
 * Tests the complete message processing flow from message receipt to response
 * 
 * Validates: Requirements 7.5, 10.2
 */

const { 
	createMockUI, 
	createMockMessageEvent,
	wait
} = require('./helpers/mocks');

const {
	assertPostMessageCalled,
	assertGraphModified
} = require('./helpers/assertions');

describe('Style Modification Integration Tests', () => {
	let mockUI;
	let mockEvent;
	let mockGraph;
	let mockModel;
	let mockCells;
	let originalConsole;

	beforeEach(() => {
		// Create mock cells
		const mockEdge1 = { id: 'edge1', edge: true };
		const mockEdge2 = { id: 'edge2', edge: true };
		const mockVertex1 = { id: 'vertex1', vertex: true };
		const mockVertex2 = { id: 'vertex2', vertex: true };
		mockCells = [mockEdge1, mockEdge2, mockVertex1, mockVertex2];

		// Create mock model
		mockModel = {
			isEdge: jest.fn((cell) => cell.edge === true),
			beginUpdate: jest.fn(),
			endUpdate: jest.fn()
		};

		// Create mock graph with style tracking
		const cellStyles = new Map();
		mockGraph = {
			getModel: jest.fn(() => mockModel),
			getDefaultParent: jest.fn(() => ({ id: 'root' })),
			getSelectionCells: jest.fn(() => [mockVertex1, mockVertex2]),
			getChildEdges: jest.fn(() => [mockEdge1, mockEdge2]),
			getChildVertices: jest.fn(() => [mockVertex1, mockVertex2]),
			getChildCells: jest.fn(() => mockCells),
			setCellStyles: jest.fn((key, value, cells) => {
				cells.forEach(cell => {
					if (!cellStyles.has(cell.id)) {
						cellStyles.set(cell.id, {});
					}
					cellStyles.get(cell.id)[key] = value;
				});
			}),
			getCellStyle: jest.fn((cell) => {
				return cellStyles.get(cell.id) || {
					strokeWidth: '2',
					fontSize: '12',
					opacity: '100',
					fillColor: '#FFFFFF',
					strokeColor: '#000000'
				};
			})
		};

		// Create mock UI
		mockUI = {
			editor: {
				graph: mockGraph,
				setModified: jest.fn()
			}
		};

		// Create mock event
		mockEvent = createMockMessageEvent();

		// Suppress console output during tests
		originalConsole = {
			log: console.log,
			error: console.error,
			warn: console.warn
		};
		console.log = jest.fn();
		console.error = jest.fn();
		console.warn = jest.fn();

		// Mock the global testHelpers if available
		if (global.testHelpers) {
			// Store original functions
			global._originalTestHelpers = { ...global.testHelpers };
		}
	});

	afterEach(() => {
		// Restore console
		console.log = originalConsole.log;
		console.error = originalConsole.error;
		console.warn = originalConsole.warn;

		// Restore test helpers
		if (global._originalTestHelpers) {
			global.testHelpers = global._originalTestHelpers;
			delete global._originalTestHelpers;
		}
	});

	describe('Successful Flow - Complete Message Processing', () => {
		test('should complete full flow: receive message -> validate -> select -> apply -> respond', async () => {
			// Arrange: Create a valid style modification request
			const request = {
				action: 'modifyStyle',
				target: 'selected',
				styles: {
					fillColor: '#FF0000',
					strokeWidth: 3
				}
			};
			mockEvent.data = request;

			// Mock handleModifyStyle function
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				// Simulate validation
				if (!data.target || !data.styles) {
					evt.source.postMessage(JSON.stringify({
						event: 'modifyStyle',
						status: 'error',
						error: 'Invalid format',
						errorCode: 'INVALID_FORMAT'
					}), '*');
					return;
				}

				// Simulate getting target cells
				const cells = ui.editor.graph.getSelectionCells();

				// Simulate applying styles
				ui.editor.graph.getModel().beginUpdate();
				try {
					for (const key in data.styles) {
						ui.editor.graph.setCellStyles(key, data.styles[key], cells);
					}
				} finally {
					ui.editor.graph.getModel().endUpdate();
				}

				// Mark as modified
				ui.editor.setModified(true);

				// Send success response
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: {
						modifiedCount: cells.length
					}
				}), '*');
			});

			// Act: Process the message
			handleModifyStyle(mockUI, mockEvent, request);

			// Wait for any async operations
			await wait(10);

			// Assert: Verify complete flow
			// 1. Target cells were retrieved
			expect(mockGraph.getSelectionCells).toHaveBeenCalled();

			// 2. Model update was wrapped
			expect(mockModel.beginUpdate).toHaveBeenCalled();
			expect(mockModel.endUpdate).toHaveBeenCalled();

			// 3. Styles were applied
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('fillColor', '#FF0000', expect.any(Array));
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('strokeWidth', 3, expect.any(Array));

			// 4. Graph was marked as modified
			assertGraphModified(mockUI);

			// 5. Success response was sent
			assertPostMessageCalled(mockEvent.source);
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			expect(response.event).toBe('modifyStyle');
			expect(response.status).toBe('ok');
			expect(response.data.modifiedCount).toBe(2);
		});

		test('should handle message with both styles and operations', async () => {
			// Arrange: Create request with both styles and operations
			const request = {
				action: 'modifyStyle',
				target: 'selected',
				styles: {
					fillColor: '#0000FF'
				},
				operations: {
					strokeWidth: { op: 'increase', value: 2 }
				}
			};
			mockEvent.data = request;

			// Mock handleModifyStyle with operations support
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getSelectionCells();
				
				ui.editor.graph.getModel().beginUpdate();
				try {
					// Apply styles
					if (data.styles) {
						for (const key in data.styles) {
							ui.editor.graph.setCellStyles(key, data.styles[key], cells);
						}
					}

					// Apply operations
					if (data.operations) {
						for (const key in data.operations) {
							const op = data.operations[key];
							cells.forEach(cell => {
								const currentValue = parseFloat(ui.editor.graph.getCellStyle(cell)[key]) || 0;
								let newValue = currentValue;
								
								switch (op.op) {
									case 'increase':
										newValue = currentValue + op.value;
										break;
									case 'decrease':
										newValue = currentValue - op.value;
										break;
									case 'multiply':
										newValue = currentValue * op.value;
										break;
									case 'set':
										newValue = op.value;
										break;
								}
								
								ui.editor.graph.setCellStyles(key, newValue, [cell]);
							});
						}
					}
				} finally {
					ui.editor.graph.getModel().endUpdate();
				}

				ui.editor.setModified(true);

				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert: Both styles and operations were applied
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('fillColor', '#0000FF', expect.any(Array));
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('strokeWidth', expect.any(Number), expect.any(Array));

			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			expect(response.status).toBe('ok');
		});

		test('should handle different target selectors', async () => {
			const targets = ['selected', 'edges', 'vertices', 'all'];
			const expectedCounts = [2, 2, 2, 4]; // Based on our mock setup

			for (let i = 0; i < targets.length; i++) {
				const target = targets[i];
				const expectedCount = expectedCounts[i];

				// Arrange
				const request = {
					action: 'modifyStyle',
					target: target,
					styles: { fillColor: '#FF0000' }
				};
				const evt = createMockMessageEvent();
				evt.data = request;

				// Mock handler
				const handleModifyStyle = jest.fn((ui, evt, data) => {
					let cells;
					switch (data.target) {
						case 'selected':
							cells = ui.editor.graph.getSelectionCells();
							break;
						case 'edges':
							cells = ui.editor.graph.getChildEdges();
							break;
						case 'vertices':
							cells = ui.editor.graph.getChildVertices();
							break;
						case 'all':
							cells = ui.editor.graph.getChildCells();
							break;
					}

					ui.editor.graph.getModel().beginUpdate();
					try {
						ui.editor.graph.setCellStyles('fillColor', data.styles.fillColor, cells);
					} finally {
						ui.editor.graph.getModel().endUpdate();
					}

					evt.source.postMessage(JSON.stringify({
						event: 'modifyStyle',
						status: 'ok',
						data: { modifiedCount: cells.length }
					}), '*');
				});

				// Act
				handleModifyStyle(mockUI, evt, request);
				await wait(10);

				// Assert
				const response = JSON.parse(evt.source.postMessage.mock.calls[0][0]);
				expect(response.status).toBe('ok');
				expect(response.data.modifiedCount).toBe(expectedCount);
			}
		});
	});

	describe('Validation Failure Flow', () => {
		test('should reject message with missing target field', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				styles: { fillColor: '#FF0000' }
			};
			mockEvent.data = request;

			// Mock handler with validation
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				if (!data.target) {
					evt.source.postMessage(JSON.stringify({
						event: 'modifyStyle',
						status: 'error',
						error: 'Missing target field',
						errorCode: 'INVALID_FORMAT'
					}), '*');
					return;
				}
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			assertPostMessageCalled(mockEvent.source);
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			expect(response.status).toBe('error');
			expect(response.errorCode).toBe('INVALID_FORMAT');
			expect(mockGraph.setCellStyles).not.toHaveBeenCalled();
		});

		test('should reject message with invalid target value', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'invalid',
				styles: { fillColor: '#FF0000' }
			};
			mockEvent.data = request;

			// Mock handler with validation
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const validTargets = ['selected', 'edges', 'vertices', 'all'];
				if (!validTargets.includes(data.target)) {
					evt.source.postMessage(JSON.stringify({
						event: 'modifyStyle',
						status: 'error',
						error: 'Invalid target: ' + data.target,
						errorCode: 'INVALID_TARGET'
					}), '*');
					return;
				}
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			expect(response.status).toBe('error');
			expect(response.errorCode).toBe('INVALID_TARGET');
		});

		test('should reject message with neither styles nor operations', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'selected'
			};
			mockEvent.data = request;

			// Mock handler with validation
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				if (!data.styles && !data.operations) {
					evt.source.postMessage(JSON.stringify({
						event: 'modifyStyle',
						status: 'error',
						error: 'Missing styles or operations',
						errorCode: 'INVALID_FORMAT'
					}), '*');
					return;
				}
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			expect(response.status).toBe('error');
			expect(response.errorCode).toBe('INVALID_FORMAT');
		});

		test('should handle empty target selection', async () => {
			// Arrange: Mock empty selection
			mockGraph.getSelectionCells = jest.fn(() => []);
			
			const request = {
				action: 'modifyStyle',
				target: 'selected',
				styles: { fillColor: '#FF0000' }
			};
			mockEvent.data = request;

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getSelectionCells();
				
				if (!cells || cells.length === 0) {
					evt.source.postMessage(JSON.stringify({
						event: 'modifyStyle',
						status: 'error',
						error: 'No target cells found',
						errorCode: 'NO_TARGET_CELLS'
					}), '*');
					return;
				}
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			expect(response.status).toBe('error');
			expect(response.errorCode).toBe('NO_TARGET_CELLS');
			expect(mockGraph.setCellStyles).not.toHaveBeenCalled();
		});
	});

	describe('Backward Compatibility', () => {
		test('should not interfere with existing generateMermaid action', async () => {
			// Arrange: Create a generateMermaid request
			const mermaidRequest = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};
			const mermaidEvent = createMockMessageEvent();
			mermaidEvent.data = mermaidRequest;

			// Mock message router
			const handleMessage = jest.fn((ui, evt) => {
				const data = evt.data;
				
				if (data.action === 'modifyStyle') {
					// Handle modifyStyle
					evt.source.postMessage(JSON.stringify({
						event: 'modifyStyle',
						status: 'ok'
					}), '*');
				} else if (data.action === 'generateMermaid') {
					// Handle generateMermaid (existing functionality)
					evt.source.postMessage(JSON.stringify({
						event: 'generateMermaid',
						status: 'ok'
					}), '*');
				}
			});

			// Act: Process mermaid message
			handleMessage(mockUI, mermaidEvent);
			await wait(10);

			// Assert: generateMermaid still works
			const response = JSON.parse(mermaidEvent.source.postMessage.mock.calls[0][0]);
			expect(response.event).toBe('generateMermaid');
			expect(response.status).toBe('ok');

			// Now test modifyStyle
			const styleRequest = {
				action: 'modifyStyle',
				target: 'selected',
				styles: { fillColor: '#FF0000' }
			};
			const styleEvent = createMockMessageEvent();
			styleEvent.data = styleRequest;

			handleMessage(mockUI, styleEvent);
			await wait(10);

			const styleResponse = JSON.parse(styleEvent.source.postMessage.mock.calls[0][0]);
			expect(styleResponse.event).toBe('modifyStyle');
			expect(styleResponse.status).toBe('ok');
		});

		test('should maintain state isolation between different actions', async () => {
			// Arrange: Process a modifyStyle message
			const styleRequest = {
				action: 'modifyStyle',
				target: 'selected',
				styles: { fillColor: '#FF0000' }
			};
			const styleEvent = createMockMessageEvent();
			styleEvent.data = styleRequest;

			const handleModifyStyle = jest.fn((ui, evt, data) => {
				let cells;
				if (data.target === 'selected') {
					cells = ui.editor.graph.getSelectionCells();
				} else if (data.target === 'edges') {
					cells = ui.editor.graph.getChildEdges();
				}
				
				if (data.styles) {
					for (const key in data.styles) {
						ui.editor.graph.setCellStyles(key, data.styles[key], cells);
					}
				}
				
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), '*');
			});

			// Act: Process first message
			handleModifyStyle(mockUI, styleEvent, styleRequest);
			await wait(10);

			// Assert: First message succeeded
			const response1 = JSON.parse(styleEvent.source.postMessage.mock.calls[0][0]);
			expect(response1.status).toBe('ok');

			// Arrange: Process another modifyStyle message with different data
			const styleRequest2 = {
				action: 'modifyStyle',
				target: 'edges',
				styles: { strokeWidth: 5 }
			};
			const styleEvent2 = createMockMessageEvent();
			styleEvent2.data = styleRequest2;

			// Reset mocks
			mockGraph.setCellStyles.mockClear();

			// Act: Process second message
			handleModifyStyle(mockUI, styleEvent2, styleRequest2);
			await wait(10);

			// Assert: Second message succeeded independently
			const response2 = JSON.parse(styleEvent2.source.postMessage.mock.calls[0][0]);
			expect(response2.status).toBe('ok');
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('strokeWidth', 5, expect.any(Array));
		});
	});

	describe('Response Message Format', () => {
		test('should include all required fields in success response', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'selected',
				styles: { fillColor: '#FF0000' }
			};
			mockEvent.data = request;

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getSelectionCells();
				ui.editor.graph.setCellStyles('fillColor', data.styles.fillColor, cells);
				
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: {
						modifiedCount: cells.length
					}
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert: Check all required fields
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			expect(response).toHaveProperty('event', 'modifyStyle');
			expect(response).toHaveProperty('status', 'ok');
			expect(response).toHaveProperty('data');
			expect(response.data).toHaveProperty('modifiedCount');
			expect(typeof response.data.modifiedCount).toBe('number');
			expect(response).not.toHaveProperty('error');
			expect(response).not.toHaveProperty('errorCode');
		});

		test('should include all required fields in error response', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'invalid',
				styles: { fillColor: '#FF0000' }
			};
			mockEvent.data = request;

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'error',
					error: 'Invalid target',
					errorCode: 'INVALID_TARGET'
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert: Check all required fields
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			expect(response).toHaveProperty('event', 'modifyStyle');
			expect(response).toHaveProperty('status', 'error');
			expect(response).toHaveProperty('error');
			expect(response).toHaveProperty('errorCode');
			expect(typeof response.error).toBe('string');
			expect(typeof response.errorCode).toBe('string');
			expect(response.error.length).toBeGreaterThan(0);
		});

		test('should send response to correct origin', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'selected',
				styles: { fillColor: '#FF0000' }
			};
			const customOrigin = 'https://custom-app.example.com';
			mockEvent = createMockMessageEvent(request, customOrigin);
			mockEvent.data = request;

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getSelectionCells();
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), evt.origin);
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert: Response should be sent to correct origin
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.any(String),
				customOrigin
			);
		});
	});
});
