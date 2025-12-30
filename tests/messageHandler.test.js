/**
 * Tests for Message Handler
 */

const { createMockUI, createMockMessageEvent } = require('./helpers/mocks');

// Load the modules
require('../src/main/webapp/js/mermaid-validator.js');
require('../src/main/webapp/js/mermaid-parser.js');
require('../src/main/webapp/js/canvas-inserter.js');
require('../src/main/webapp/js/message-handler.js');

describe('MessageHandler', () => {
	let mockUI;
	let mockEvent;

	beforeEach(() => {
		mockUI = createMockUI();
		mockEvent = createMockMessageEvent();
		
		// Reset debug mode
		window.MermaidValidator.CONFIG.DEBUG_MODE = false;
	});

	describe('handleGenerateMermaid', () => {
		test('should handle valid message and insert diagram', async () => {
			const data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			// Mock successful insertion
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

			// Call handler
			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, data);

			// Wait for async operations
			await new Promise(resolve => setTimeout(resolve, 50));

			// Verify parsing was called
			expect(mockUI.parseMermaidDiagram).toHaveBeenCalledWith(
				data.mermaid,
				null,
				expect.any(Function),
				expect.any(Function)
			);

			// Verify insertion was called
			expect(mockUI.importXml).toHaveBeenCalled();

			// Verify response was sent
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"status":"ok"'),
				mockEvent.origin
			);
		});

		test('should reject invalid message format', () => {
			const data = {
				action: 'generateMermaid'
				// Missing mermaid field
			};

			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, data);

			// Verify error response was sent
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"status":"error"'),
				mockEvent.origin
			);
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('INVALID_FORMAT'),
				mockEvent.origin
			);
		});

		test('should reject empty mermaid text', () => {
			const data = {
				action: 'generateMermaid',
				mermaid: '   '
			};

			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, data);

			// Verify error response was sent
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"status":"error"'),
				mockEvent.origin
			);
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('EMPTY_MERMAID'),
				mockEvent.origin
			);
		});

		test('should handle parsing errors', async () => {
			const data = {
				action: 'generateMermaid',
				mermaid: 'invalid mermaid syntax'
			};

			// Mock parsing failure
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => error(new Error('Syntax error at line 1')), 0);
			});

			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, data);

			// Wait for async operations
			await new Promise(resolve => setTimeout(resolve, 50));

			// Verify error response was sent
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"status":"error"'),
				mockEvent.origin
			);
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('PARSE_ERROR'),
				mockEvent.origin
			);
		});

		test('should handle insertion errors', async () => {
			const data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			// Mock insertion failure
			mockUI.importXml = jest.fn(() => {
				throw new Error('Canvas is locked');
			});

			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, data);

			// Wait for async operations
			await new Promise(resolve => setTimeout(resolve, 50));

			// Verify error response was sent
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"status":"error"'),
				mockEvent.origin
			);
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('INSERT_FAILED'),
				mockEvent.origin
			);
		});

		test('should apply position option', async () => {
			const data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B',
				options: {
					position: { x: 100, y: 200 }
				}
			};

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			// Mock successful insertion
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, data);

			// Wait for async operations
			await new Promise(resolve => setTimeout(resolve, 50));

			// Verify insertion was called with correct position
			expect(mockUI.importXml).toHaveBeenCalledWith(
				expect.any(String),
				100,
				200,
				true
			);
		});

		test('should apply scale option', async () => {
			const data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B',
				options: {
					scale: 1.5
				}
			};

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			// Mock successful insertion
			const mockCells = [{ id: 'cell1' }];
			mockUI.importXml = jest.fn(() => mockCells);

			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, data);

			// Wait for async operations
			await new Promise(resolve => setTimeout(resolve, 50));

			// Verify scale was applied
			expect(mockUI.editor.graph.scaleCells).toHaveBeenCalledWith(
				mockCells,
				1.5,
				1.5
			);
		});

		test('should select inserted cells by default', async () => {
			const data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			// Mock successful insertion
			const mockCells = [{ id: 'cell1' }];
			mockUI.importXml = jest.fn(() => mockCells);

			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, data);

			// Wait for async operations
			await new Promise(resolve => setTimeout(resolve, 50));

			// Verify cells were selected
			expect(mockUI.editor.graph.setSelectionCells).toHaveBeenCalledWith(mockCells);
		});

		test('should mark document as modified', async () => {
			const data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			// Mock successful insertion
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }]);

			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, data);

			// Wait for async operations
			await new Promise(resolve => setTimeout(resolve, 50));

			// Verify document was marked as modified
			expect(mockUI.editor.setModified).toHaveBeenCalledWith(true);
		});

		test('should include cellCount in success response', async () => {
			const data = {
				action: 'generateMermaid',
				mermaid: 'flowchart TD\n    A --> B'
			};

			// Mock successful parsing
			mockUI.parseMermaidDiagram = jest.fn((text, opts, success, error) => {
				setTimeout(() => success('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
			});

			// Mock successful insertion with multiple cells
			mockUI.importXml = jest.fn(() => [{ id: 'cell1' }, { id: 'cell2' }, { id: 'cell3' }]);

			window.MessageHandler.handleGenerateMermaid(mockUI, mockEvent, data);

			// Wait for async operations
			await new Promise(resolve => setTimeout(resolve, 50));

			// Verify response includes cellCount
			expect(mockEvent.source.postMessage).toHaveBeenCalledWith(
				expect.stringContaining('"cellCount":3'),
				mockEvent.origin
			);
		});
	});
});
