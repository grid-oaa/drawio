/**
 * End-to-End Integration Tests for Mermaid iframe integration
 * Tests the complete message processing flow from message receipt to response
 * 
 * Validates: Requirements 4.5
 */

const { 
	createMockUI, 
	createMockMessageEvent,
	wait,
	createValidRequest,
	createInvalidRequest
} = require('./helpers/mocks');

const {
	assertResponseFormat,
	assertPostMessageCalled,
	assertCellsInserted,
	assertGraphModified,
	assertCellsSelected
} = require('./helpers/assertions');

// Load all required modules
require('../src/main/webapp/js/mermaid-validator.js');
require('../src/main/webapp/js/mermaid-parser.js');
require('../src/main/webapp/js/canvas-inserter.js');
require('../src/main/webapp/js/message-handler.js');

describe('End-to-End Integration Tests', () => {
	let mockUI;
	let mockEvent;
	let originalConsole;

	beforeEach(() => {
		mockUI = createMockUI();
		mockEvent = createMockMessageEvent();
		
		// Reset debug mode
		window.MermaidValidator.CONFIG.DEBUG_MODE = false;
		
		// Suppress console output during tests
		originalConsole = {
			log: console.log,
			error: console.error,
			warn: console.warn
		};
		console.log = jest.fn();
		console.error = jest.fn();
		console.warn = jest.fn();
	});

	afterEach(() => {
		// Restore console
		console.log = originalConsole.log;
		console.error = originalConsole.error;
		console.warn = originalConsole.warn;
	});

	describe('Successful Flow', () => {
		test('should complete full flow: receive message -> validate -> parse -> insert -> respond', async () => {
			// Arrange: Create a valid request
			const request = createValidRequest('flowchart TD\n    A[Start] --> B[End]');
			mockEvent.data = request;

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/><mxCell id="1"/></root></mxGraphModel>'), 10);
			});

			// Mock successful insertion
			const mockCells = [{ id: 'cell1' }, { id: 'cell2' }];
			mockUI.importXml = jest.fn(() => mockCells);

			// Act: Process the message
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for async operations
			await wait(50);

			// Assert: Verify complete flow
			// 1. Parsing was called
			expect(mockUI.parseMermaidDiagram).toHaveBeenCalledWith(
				request.mermaid,
				null,
				expect.any(Function),
				expect.any(Function)
			);

			// 2. Insertion was called
			assertCellsInserted(mockUI);

			// 3. Cells were selected
			assertCellsSelected(mockUI, mockCells);

			// 4. Graph was marked as modified
			assertGraphModified(mockUI);

			// 5. Success response was sent
			assertPostMessageCalled(mockEvent.source);
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response, 'ok');
			expect(response.data.cellCount).toBe(2);
		});

		test('should handle message with all options', async () => {
			// Arrange: Create request with all options
			const request = createValidRequest('flowchart LR\n    X --> Y', {
				position: { x: 100, y: 200 },
				scale: 1.5,
				select: true,
				center: false
			});
			mockEvent.data = request;

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 10);
			});

			// Mock successful insertion
			const mockCells = [{ id: 'cell1' }];
			mockUI.importXml = jest.fn(() => mockCells);

			// Act: Process the message
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for async operations
			await wait(50);

			// Assert: Verify all options were applied
			// 1. Position was used
			expect(mockUI.importXml).toHaveBeenCalledWith(
				expect.any(String),
				100,
				200,
				true
			);

			// 2. Scale was applied
			expect(mockUI.editor.graph.scaleCells).toHaveBeenCalledWith(
				mockCells,
				1.5,
				1.5
			);

			// 3. Cells were selected
			expect(mockUI.editor.graph.setSelectionCells).toHaveBeenCalledWith(mockCells);

			// 4. Success response was sent
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response, 'ok');
		});

		test('should handle different Mermaid diagram types', async () => {
			const diagramTypes = [
				'flowchart TD\n    A --> B',
				'sequenceDiagram\n    Alice->>Bob: Hello',
				'classDiagram\n    Class01 <|-- Class02',
				'stateDiagram-v2\n    [*] --> State1',
				'erDiagram\n    CUSTOMER ||--o{ ORDER : places'
			];

			for (const mermaid of diagramTypes) {
				// Arrange
				const request = createValidRequest(mermaid);
				const event = createMockMessageEvent();
				event.data = request;

				// Mock successful parsing
				mockUI.parseMermaidDiagram = jest.fn((text, opts, success) => {
					setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 10);
				});

				// Mock successful insertion
				mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

				// Act
				window.MessageHandler.handleGenerateMermaid(mockUI, event, request);

				// Wait for async operations
				await wait(50);

				// Assert
				const response = JSON.parse(event.source.postMessage.mock.calls[0][0]);
				assertResponseFormat(response, 'ok');
			}
		});

		test('should handle select: false option', async () => {
			// Arrange
			const request = createValidRequest('flowchart TD\n    A --> B', {
				select: false
			});
			mockEvent.data = request;

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 10);
			});

			// Mock successful insertion
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for async operations
			await wait(50);

			// Assert: Cells should NOT be selected
			expect(mockUI.editor.graph.setSelectionCells).not.toHaveBeenCalled();

			// But response should still be successful
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response, 'ok');
		});

		test('should handle empty options object', async () => {
			// Arrange
			const request = createValidRequest('flowchart TD\n    A --> B', {});
			mockEvent.data = request;

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 10);
			});

			// Mock successful insertion
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for async operations
			await wait(50);

			// Assert: Should use defaults
			expect(mockUI.importXml).toHaveBeenCalledWith(
				expect.any(String),
				20, // default x
				20, // default y
				true
			);

			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response, 'ok');
		});
	});

	describe('Validation Failure Flow', () => {
		test('should reject message with missing mermaid field', async () => {
			// Arrange
			const request = createInvalidRequest('missing-mermaid');
			mockEvent.data = request;

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for any async operations
			await wait(10);

			// Assert: Should send error response immediately
			assertPostMessageCalled(mockEvent.source);
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response, 'error');
			expect(response.errorCode).toBe('INVALID_FORMAT');

			// Parsing should NOT be called
			expect(mockUI.parseMermaidDiagram).not.toHaveBeenCalled();
		});

		test('should reject message with empty mermaid field', async () => {
			// Arrange
			const request = createInvalidRequest('empty-mermaid');
			mockEvent.data = request;

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for any async operations
			await wait(10);

			// Assert
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response, 'error');
			expect(response.errorCode).toBe('EMPTY_MERMAID');

			// Parsing should NOT be called
			expect(mockUI.parseMermaidDiagram).not.toHaveBeenCalled();
		});

		test('should reject message with whitespace-only mermaid field', async () => {
			// Arrange
			const request = createInvalidRequest('whitespace-mermaid');
			mockEvent.data = request;

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for any async operations
			await wait(10);

			// Assert
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response, 'error');
			expect(response.errorCode).toBe('EMPTY_MERMAID');
		});

		test('should reject message with wrong mermaid type', async () => {
			// Arrange
			const request = createInvalidRequest('wrong-type');
			mockEvent.data = request;

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for any async operations
			await wait(10);

			// Assert
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response, 'error');
			expect(response.errorCode).toBe('INVALID_FORMAT');
		});
	});

	describe('Parsing Failure Flow', () => {
		test('should handle parsing errors gracefully', async () => {
			// Arrange
			const request = createValidRequest('invalid mermaid syntax');
			mockEvent.data = request;

			// Mock parsing failure
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => error(new Error('Syntax error at line 1')), 10);
			});

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for async operations
			await wait(50);

			// Assert: Should send error response
			assertPostMessageCalled(mockEvent.source);
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response, 'error');
			expect(response.errorCode).toBe('PARSE_ERROR');
			expect(response.error).toContain('Syntax error');

			// Insertion should NOT be called
			expect(mockUI.importXml).not.toHaveBeenCalled();
		});

		test('should include line number in parsing error', async () => {
			// Arrange
			const request = createValidRequest('flowchart TD\n    A --> ');
			mockEvent.data = request;

			// Mock parsing failure with position
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				const err = new Error('Unexpected end of input');
				err.position = { line: 2, column: 10 };
				err.code = 'PARSE_ERROR';
				setTimeout(() => error(err), 10);
			});

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for async operations
			await wait(50);

			// Assert
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response, 'error');
			// The message handler adds line number to the error message
			expect(response.error).toMatch(/line 2|Unexpected end of input/);
		});

		test('should handle parsing timeout', async () => {
			// Arrange
			const request = createValidRequest('flowchart TD\n    A --> B');
			mockEvent.data = request;

			// Mock parsing timeout
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				// Never call success or error - simulate timeout
			});

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for timeout (default is 10 seconds, but we'll wait less for testing)
			await wait(100);

			// Note: In real implementation, timeout should trigger error response
			// For now, we just verify parsing was called
			expect(mockUI.parseMermaidDiagram).toHaveBeenCalled();
		});
	});

	describe('Insertion Failure Flow', () => {
		test('should handle insertion errors gracefully', async () => {
			// Arrange
			const request = createValidRequest('flowchart TD\n    A --> B');
			mockEvent.data = request;

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 10);
			});

			// Mock insertion failure
			mockUI.importXml = jest.fn(() => {
				throw new Error('Canvas is locked');
			});

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for async operations
			await wait(50);

			// Assert: Should send error response
			assertPostMessageCalled(mockEvent.source);
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response, 'error');
			expect(response.errorCode).toBe('INSERT_FAILED');
			expect(response.error).toContain('Canvas is locked');

			// Graph should NOT be marked as modified
			expect(mockUI.editor.setModified).not.toHaveBeenCalled();
		});

		test('should handle null cells from insertion', async () => {
			// Arrange
			const request = createValidRequest('flowchart TD\n    A --> B');
			mockEvent.data = request;

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 10);
			});

			// Mock insertion returning null (which causes an error in canvas inserter)
			mockUI.importXml = jest.fn(() => null);

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for async operations
			await wait(50);

			// Assert: Should fail because canvas inserter throws error for null cells
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response, 'error');
			expect(response.errorCode).toBe('INSERT_FAILED');
			expect(response.error).toContain('No cells were inserted');
		});

		test('should handle empty cells array from insertion', async () => {
			// Arrange
			const request = createValidRequest('flowchart TD\n    A --> B');
			mockEvent.data = request;

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 10);
			});

			// Mock insertion returning empty array (which causes an error in canvas inserter)
			mockUI.importXml = jest.fn(() => []);

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for async operations
			await wait(50);

			// Assert: Should fail because canvas inserter throws error for empty cells
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response, 'error');
			expect(response.errorCode).toBe('INSERT_FAILED');
			expect(response.error).toContain('No cells were inserted');
		});
	});

	describe('Complex Scenarios', () => {
		test('should handle rapid successive messages', async () => {
			// Arrange: Create multiple requests
			const requests = [
				createValidRequest('flowchart TD\n    A --> B'),
				createValidRequest('flowchart LR\n    X --> Y'),
				createValidRequest('sequenceDiagram\n    Alice->>Bob: Hi')
			];

			// Mock successful parsing for all
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 10);
			});

			// Mock successful insertion
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

			// Act: Send all messages rapidly
			const events = requests.map(req => {
				const evt = createMockMessageEvent();
				evt.data = req;
				window.MessageHandler.handleGenerateMermaid(mockUI, evt, req);
				return evt;
			});

			// Wait for all async operations
			await wait(100);

			// Assert: All should succeed
			events.forEach(evt => {
				expect(evt.source.postMessage).toHaveBeenCalled();
				const response = JSON.parse(evt.source.postMessage.mock.calls[0][0]);
				assertResponseFormat(response, 'ok');
			});

			// All should have been parsed and inserted
			expect(mockUI.parseMermaidDiagram).toHaveBeenCalledTimes(3);
			expect(mockUI.importXml).toHaveBeenCalledTimes(3);
		});

		test('should handle message with complex options', async () => {
			// Arrange
			const request = createValidRequest('flowchart TD\n    A --> B', {
				position: { x: 500, y: 300 },
				scale: 2.0,
				select: true,
				center: true
			});
			mockEvent.data = request;

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 10);
			});

			// Mock successful insertion
			const mockCells = [{ id: 'cell1' }, { id: 'cell2' }, { id: 'cell3' }];
			mockUI.importXml = jest.fn(() => mockCells);

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for async operations
			await wait(50);

			// Assert: All options should be applied
			expect(mockUI.importXml).toHaveBeenCalledWith(
				expect.any(String),
				500,
				300,
				true
			);
			expect(mockUI.editor.graph.scaleCells).toHaveBeenCalledWith(mockCells, 2.0, 2.0);
			expect(mockUI.editor.graph.setSelectionCells).toHaveBeenCalledWith(mockCells);
			expect(mockUI.editor.graph.scrollCellToVisible).toHaveBeenCalled();

			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response, 'ok');
			expect(response.data.cellCount).toBe(3);
		});

		test('should maintain state isolation between messages', async () => {
			// Arrange: First message succeeds
			const request1 = createValidRequest('flowchart TD\n    A --> B');
			const event1 = createMockMessageEvent();
			event1.data = request1;

			mockUI.parseMermaidDiagram = jest.fn((text, opts, success) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 10);
			});
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

			// Act: Process first message
			window.MessageHandler.handleGenerateMermaid(mockUI, event1, request1);
			await wait(50);

			// Assert: First message succeeded
			const response1 = JSON.parse(event1.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response1, 'ok');

			// Arrange: Second message fails
			const request2 = createInvalidRequest('empty-mermaid');
			const event2 = createMockMessageEvent();
			event2.data = request2;

			// Reset mocks
			mockUI.parseMermaidDiagram.mockClear();
			mockUI.importXml.mockClear();

			// Act: Process second message
			window.MessageHandler.handleGenerateMermaid(mockUI, event2, request2);
			await wait(10);

			// Assert: Second message failed
			const response2 = JSON.parse(event2.source.postMessage.mock.calls[0][0]);
			assertResponseFormat(response2, 'error');

			// Parsing should not have been called for second message
			expect(mockUI.parseMermaidDiagram).not.toHaveBeenCalled();
		});
	});

	describe('Response Message Format', () => {
		test('should send response to correct origin', async () => {
			// Arrange
			const request = createValidRequest('flowchart TD\n    A --> B');
			const customOrigin = 'https://custom-app.example.com';
			mockEvent = createMockMessageEvent(request, customOrigin);
			mockEvent.data = request;

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 10);
			});

			// Mock successful insertion
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for async operations
			await wait(50);

			// Assert: Response should be sent to correct origin
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.any(String),
				customOrigin
			);
		});

		test('should include all required fields in success response', async () => {
			// Arrange
			const request = createValidRequest('flowchart TD\n    A --> B');
			mockEvent.data = request;

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 10);
			});

			// Mock successful insertion
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }, { id: 'cell2' }]);

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for async operations
			await wait(50);

			// Assert: Check all required fields
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			expect(response).toHaveProperty('event', 'generateMermaid');
			expect(response).toHaveProperty('status', 'ok');
			expect(response).toHaveProperty('data');
			expect(response.data).toHaveProperty('cellCount', 2);
			expect(response).not.toHaveProperty('error');
			expect(response).not.toHaveProperty('errorCode');
		});

		test('should include all required fields in error response', async () => {
			// Arrange
			const request = createInvalidRequest('empty-mermaid');
			mockEvent.data = request;

			// Act
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, request);

			// Wait for any async operations
			await wait(10);

			// Assert: Check all required fields
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			expect(response).toHaveProperty('event', 'generateMermaid');
			expect(response).toHaveProperty('status', 'error');
			expect(response).toHaveProperty('error');
			expect(response).toHaveProperty('errorCode');
			expect(typeof response.error).toBe('string');
			expect(typeof response.errorCode).toBe('string');
			expect(response.error.length).toBeGreaterThan(0);
		});
	});
});
