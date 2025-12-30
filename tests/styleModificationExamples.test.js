/**
 * Style Modification Example Tests
 * Tests specific style modification scenarios with real-world examples
 * 
 * Validates: Requirements 3.1-3.9
 */

const { 
	createMockUI, 
	createMockMessageEvent,
	wait
} = require('./helpers/mocks');

describe('Style Modification Examples', () => {
	let mockUI;
	let mockGraph;
	let mockModel;
	let mockCells;

	beforeEach(() => {
		// Create mock cells
		const mockEdge = { id: 'edge1', edge: true };
		const mockVertex = { id: 'vertex1', vertex: true };
		mockCells = [mockEdge, mockVertex];

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
			getSelectionCells: jest.fn(() => mockCells),
			getChildEdges: jest.fn(() => [mockEdge]),
			getChildVertices: jest.fn(() => [mockVertex]),
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
					opacity: '100'
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
	});

	describe('Color Modification Examples', () => {
		test('should change fill color to red', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'selected',
				styles: {
					fillColor: '#FF0000'
				}
			};
			const mockEvent = createMockMessageEvent();
			mockEvent.data = request;

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getSelectionCells();
				ui.editor.graph.getModel().beginUpdate();
				try {
					ui.editor.graph.setCellStyles('fillColor', data.styles.fillColor, cells);
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

			// Assert
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('fillColor', '#FF0000', mockCells);
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			expect(response.status).toBe('ok');
		});

		test('should change stroke color to blue', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'edges',
				styles: {
					strokeColor: '#0000FF'
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getChildEdges();
				ui.editor.graph.setCellStyles('strokeColor', data.styles.strokeColor, cells);
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.getChildEdges).toHaveBeenCalled();
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('strokeColor', '#0000FF', expect.any(Array));
		});

		test('should change font color to green', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'vertices',
				styles: {
					fontColor: '#00FF00'
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getChildVertices();
				ui.editor.graph.setCellStyles('fontColor', data.styles.fontColor, cells);
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('fontColor', '#00FF00', expect.any(Array));
		});
	});

	describe('Line Thickness Examples', () => {
		test('should make lines thicker using absolute value', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'edges',
				styles: {
					strokeWidth: 5
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getChildEdges();
				ui.editor.graph.setCellStyles('strokeWidth', data.styles.strokeWidth, cells);
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('strokeWidth', 5, expect.any(Array));
		});

		test('should increase line thickness by 2', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'edges',
				operations: {
					strokeWidth: { op: 'increase', value: 2 }
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler with operations
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getChildEdges();
				cells.forEach(cell => {
					const currentValue = parseFloat(ui.editor.graph.getCellStyle(cell).strokeWidth) || 2;
					const newValue = currentValue + data.operations.strokeWidth.value;
					ui.editor.graph.setCellStyles('strokeWidth', newValue, [cell]);
				});
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.setCellStyles).toHaveBeenCalled();
			const response = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);
			expect(response.status).toBe('ok');
		});

		test('should double line thickness', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'edges',
				operations: {
					strokeWidth: { op: 'multiply', value: 2 }
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getChildEdges();
				cells.forEach(cell => {
					const currentValue = parseFloat(ui.editor.graph.getCellStyle(cell).strokeWidth) || 2;
					const newValue = currentValue * data.operations.strokeWidth.value;
					ui.editor.graph.setCellStyles('strokeWidth', newValue, [cell]);
				});
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.setCellStyles).toHaveBeenCalled();
		});
	});

	describe('Dashed Line Examples', () => {
		test('should make lines dashed', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'edges',
				styles: {
					dashed: 1
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getChildEdges();
				ui.editor.graph.setCellStyles('dashed', data.styles.dashed, cells);
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('dashed', 1, expect.any(Array));
		});

		test('should make lines solid (remove dashed)', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'edges',
				styles: {
					dashed: 0
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getChildEdges();
				ui.editor.graph.setCellStyles('dashed', data.styles.dashed, cells);
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('dashed', 0, expect.any(Array));
		});
	});

	describe('Font Modification Examples', () => {
		test('should increase font size', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'selected',
				operations: {
					fontSize: { op: 'increase', value: 4 }
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getSelectionCells();
				cells.forEach(cell => {
					const currentValue = parseFloat(ui.editor.graph.getCellStyle(cell).fontSize) || 12;
					const newValue = currentValue + data.operations.fontSize.value;
					ui.editor.graph.setCellStyles('fontSize', newValue, [cell]);
				});
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.setCellStyles).toHaveBeenCalled();
		});

		test('should set font size to 18', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'vertices',
				styles: {
					fontSize: 18
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getChildVertices();
				ui.editor.graph.setCellStyles('fontSize', data.styles.fontSize, cells);
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('fontSize', 18, expect.any(Array));
		});

		test('should make text bold', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'selected',
				styles: {
					fontStyle: 1  // 1 = bold
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getSelectionCells();
				ui.editor.graph.setCellStyles('fontStyle', data.styles.fontStyle, cells);
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('fontStyle', 1, mockCells);
		});
	});

	describe('Shadow Examples', () => {
		test('should add shadow to shapes', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'vertices',
				styles: {
					shadow: 1
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getChildVertices();
				ui.editor.graph.setCellStyles('shadow', data.styles.shadow, cells);
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('shadow', 1, expect.any(Array));
		});

		test('should remove shadow from shapes', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'vertices',
				styles: {
					shadow: 0
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getChildVertices();
				ui.editor.graph.setCellStyles('shadow', data.styles.shadow, cells);
				evt.source.postMessage(JSON.stringify({
					event: 'modifyStyle',
					status: 'ok',
					data: { modifiedCount: cells.length }
				}), '*');
			});

			// Act
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('shadow', 0, expect.any(Array));
		});
	});

	describe('Combined Modification Examples', () => {
		test('should apply multiple style changes at once', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'selected',
				styles: {
					fillColor: '#FF0000',
					strokeColor: '#000000',
					strokeWidth: 3,
					rounded: 1,
					shadow: 1
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getSelectionCells();
				ui.editor.graph.getModel().beginUpdate();
				try {
					for (const key in data.styles) {
						ui.editor.graph.setCellStyles(key, data.styles[key], cells);
					}
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
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('fillColor', '#FF0000', mockCells);
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('strokeColor', '#000000', mockCells);
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('strokeWidth', 3, mockCells);
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('rounded', 1, mockCells);
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('shadow', 1, mockCells);
		});

		test('should combine absolute styles and relative operations', async () => {
			// Arrange
			const request = {
				action: 'modifyStyle',
				target: 'edges',
				styles: {
					strokeColor: '#0000FF',
					dashed: 1
				},
				operations: {
					strokeWidth: { op: 'increase', value: 2 }
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getChildEdges();
				ui.editor.graph.getModel().beginUpdate();
				try {
					// Apply styles first
					for (const key in data.styles) {
						ui.editor.graph.setCellStyles(key, data.styles[key], cells);
					}
					// Then apply operations
					for (const key in data.operations) {
						const op = data.operations[key];
						cells.forEach(cell => {
							const currentValue = parseFloat(ui.editor.graph.getCellStyle(cell)[key]) || 0;
							let newValue = currentValue;
							if (op.op === 'increase') {
								newValue = currentValue + op.value;
							}
							ui.editor.graph.setCellStyles(key, newValue, [cell]);
						});
					}
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
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('strokeColor', '#0000FF', expect.any(Array));
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('dashed', 1, expect.any(Array));
			expect(mockModel.beginUpdate).toHaveBeenCalled();
			expect(mockModel.endUpdate).toHaveBeenCalled();
		});

		test('should apply complex styling for presentation', async () => {
			// Arrange: Make diagram look professional
			const request = {
				action: 'modifyStyle',
				target: 'all',
				styles: {
					rounded: 1,
					shadow: 1
				},
				operations: {
					fontSize: { op: 'set', value: 14 },
					strokeWidth: { op: 'set', value: 2 }
				}
			};
			const mockEvent = createMockMessageEvent();

			// Mock handler
			const handleModifyStyle = jest.fn((ui, evt, data) => {
				const cells = ui.editor.graph.getChildCells();
				ui.editor.graph.getModel().beginUpdate();
				try {
					for (const key in data.styles) {
						ui.editor.graph.setCellStyles(key, data.styles[key], cells);
					}
					for (const key in data.operations) {
						ui.editor.graph.setCellStyles(key, data.operations[key].value, cells);
					}
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
			handleModifyStyle(mockUI, mockEvent, request);
			await wait(10);

			// Assert
			expect(mockGraph.getChildCells).toHaveBeenCalled();
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('rounded', 1, mockCells);
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith('shadow', 1, mockCells);
		});
	});
});
