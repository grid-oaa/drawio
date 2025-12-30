/**
 * Integration tests for mermaid-import.js plugin with new message handler
 */

const { createMockUI, createMockMessageEvent } = require('./helpers/mocks');

// Load all required modules
require('../src/main/webapp/js/mermaid-validator.js');
require('../src/main/webapp/js/mermaid-parser.js');
require('../src/main/webapp/js/canvas-inserter.js');
require('../src/main/webapp/js/message-handler.js');

describe('Plugin Integration', () => {
	let mockUI;
	let handleMessage;

	beforeEach(() => {
		mockUI = createMockUI();
		
		// Reset debug mode
		window.MermaidValidator.CONFIG.DEBUG_MODE = false;

		// Simulate the plugin's handleMessage function
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
				// Check if MessageHandler is available
				if (window.MessageHandler && window.MessageHandler.handleGenerateMermaid) {
					window.MessageHandler.handleGenerateMermaid(mockUI, evt, data);
				} else {
					console.error('[MermaidImport] MessageHandler not loaded');
				}
				return;
			}

			// Note: We're not testing importMermaid and insertMermaid here
			// as they use the old handleMermaid function
		};
	});

	describe('handleMessage routing', () => {
		test('should route generateMermaid action to MessageHandler', async () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = JSON.stringify({
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			});

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			// Mock successful insertion
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

			// Call handleMessage
			handleMessage(mockEvent);

			// Wait for async operations
			await new Promise(resolve => setTimeout(resolve, 50));

			// Verify the message was processed
			expect(mockUI.parseMermaidDiagram).toHaveBeenCalled();
			expect(mockUI.importXml).toHaveBeenCalled();
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"status":"ok"'),
				mockEvent.origin
			);
		});

		test('should handle JSON string messages', async () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = JSON.stringify({
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			});

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			// Mock successful insertion
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

			// Call handleMessage
			handleMessage(mockEvent);

			// Wait for async operations
			await new Promise(resolve => setTimeout(resolve, 50));

			// Verify success
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"status":"ok"'),
				mockEvent.origin
			);
		});

		test('should handle object messages', async () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			// Mock successful insertion
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

			// Call handleMessage
			handleMessage(mockEvent);

			// Wait for async operations
			await new Promise(resolve => setTimeout(resolve, 50));

			// Verify success
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"status":"ok"'),
				mockEvent.origin
			);
		});

		test('should ignore invalid JSON messages', () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = 'invalid json {';

			// Spy on console.error
			const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

			// Call handleMessage
			handleMessage(mockEvent);

			// Verify no error was logged (message was silently ignored)
			expect(consoleErrorSpy).not.toHaveBeenCalled();

			consoleErrorSpy.mockRestore();
		});

		test('should ignore messages without action field', () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				mermaid: 'flowchart TD\n    A --> B'
			};

			// Mock functions should not be called
			mockUI.parseMermaidDiagram = jest.fn();
			mockUI.importXml = jest.fn();

			// Call handleMessage
			handleMessage(mockEvent);

			// Verify nothing was processed
			expect(mockUI.parseMermaidDiagram).not.toHaveBeenCalled();
			expect(mockUI.importXml).not.toHaveBeenCalled();
		});

		test('should ignore null messages', () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = null;

			// Mock functions should not be called
			mockUI.parseMermaidDiagram = jest.fn();
			mockUI.importXml = jest.fn();

			// Call handleMessage
			handleMessage(mockEvent);

			// Verify nothing was processed
			expect(mockUI.parseMermaidDiagram).not.toHaveBeenCalled();
			expect(mockUI.importXml).not.toHaveBeenCalled();
		});

		test('should pass options to handler', async () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B',
				options: {
					position: { x: 100, y: 200 },
					scale: 1.5,
					select: false
				}
			};

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			// Mock successful insertion
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

			// Call handleMessage
			handleMessage(mockEvent);

			// Wait for async operations
			await new Promise(resolve => setTimeout(resolve, 50));

			// Verify options were applied
			expect(mockUI.importXml).toHaveBeenCalledWith(
				expect.any(String),
				100,
				200,
				true
			);
			expect(mockUI.editor.graph.scaleCells).toHaveBeenCalled();
			expect(mockUI.editor.graph.setSelectionCells).not.toHaveBeenCalled();
		});
	});

	describe('backward compatibility', () => {
		test('should not interfere with other action types', () => {
			const mockEvent = createMockMessageEvent();
			mockEvent.data = {
				action: 'someOtherAction',
				data: 'test'
			};

			// Mock functions should not be called
			mockUI.parseMermaidDiagram = jest.fn();
			mockUI.importXml = jest.fn();

			// Call handleMessage
			handleMessage(mockEvent);

			// Verify nothing was processed
			expect(mockUI.parseMermaidDiagram).not.toHaveBeenCalled();
			expect(mockUI.importXml).not.toHaveBeenCalled();
		});
	});
});
