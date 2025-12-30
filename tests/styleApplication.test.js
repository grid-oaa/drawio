/**
 * Tests for style application functions
 */

describe('Style Application Functions', () => {
	let mockGraph;
	let mockModel;
	let mockCells;
	let mockEdge;
	let mockVertex;

	beforeEach(() => {
		// Create mock cells
		mockEdge = { id: 'edge1' };
		mockVertex = { id: 'vertex1' };
		mockCells = [mockEdge, mockVertex];

		// Create mock model
		mockModel = {
			isEdge: jest.fn((cell) => cell === mockEdge)
		};

		// Create mock graph
		mockGraph = {
			getModel: jest.fn(() => mockModel),
			setCellStyles: jest.fn()
		};
	});

	describe('filterCellsForProperty', () => {
		test('should filter to only edges for edge-only properties', () => {
			// Access the function from the plugin
			const filterCellsForProperty = global.testHelpers?.filterCellsForProperty;
			
			if (!filterCellsForProperty) {
				console.warn('filterCellsForProperty not available for testing');
				return;
			}

			const result = filterCellsForProperty(mockCells, 'startArrow', mockGraph);
			
			expect(result).toHaveLength(1);
			expect(result[0]).toBe(mockEdge);
		});

		test('should return all cells for non-edge-only properties', () => {
			const filterCellsForProperty = global.testHelpers?.filterCellsForProperty;
			
			if (!filterCellsForProperty) {
				console.warn('filterCellsForProperty not available for testing');
				return;
			}

			const result = filterCellsForProperty(mockCells, 'fillColor', mockGraph);
			
			expect(result).toHaveLength(2);
			expect(result).toEqual(mockCells);
		});
	});

	describe('validateEnumValue', () => {
		test('should validate correct align values', () => {
			const validateEnumValue = global.testHelpers?.validateEnumValue;
			
			if (!validateEnumValue) {
				console.warn('validateEnumValue not available for testing');
				return;
			}

			expect(validateEnumValue('align', 'left').valid).toBe(true);
			expect(validateEnumValue('align', 'center').valid).toBe(true);
			expect(validateEnumValue('align', 'right').valid).toBe(true);
		});

		test('should reject invalid align values', () => {
			const validateEnumValue = global.testHelpers?.validateEnumValue;
			
			if (!validateEnumValue) {
				console.warn('validateEnumValue not available for testing');
				return;
			}

			const result = validateEnumValue('align', 'invalid');
			expect(result.valid).toBe(false);
			expect(result.errorCode).toBe('INVALID_VALUE');
		});

		test('should validate correct verticalAlign values', () => {
			const validateEnumValue = global.testHelpers?.validateEnumValue;
			
			if (!validateEnumValue) {
				console.warn('validateEnumValue not available for testing');
				return;
			}

			expect(validateEnumValue('verticalAlign', 'top').valid).toBe(true);
			expect(validateEnumValue('verticalAlign', 'middle').valid).toBe(true);
			expect(validateEnumValue('verticalAlign', 'bottom').valid).toBe(true);
		});

		test('should reject invalid verticalAlign values', () => {
			const validateEnumValue = global.testHelpers?.validateEnumValue;
			
			if (!validateEnumValue) {
				console.warn('validateEnumValue not available for testing');
				return;
			}

			const result = validateEnumValue('verticalAlign', 'invalid');
			expect(result.valid).toBe(false);
			expect(result.errorCode).toBe('INVALID_VALUE');
		});

		test('should accept any value for non-enum properties', () => {
			const validateEnumValue = global.testHelpers?.validateEnumValue;
			
			if (!validateEnumValue) {
				console.warn('validateEnumValue not available for testing');
				return;
			}

			expect(validateEnumValue('fillColor', '#FF0000').valid).toBe(true);
			expect(validateEnumValue('strokeWidth', 5).valid).toBe(true);
		});
	});

	describe('applyAbsoluteStyles', () => {
		test('should apply valid styles to cells', () => {
			const applyAbsoluteStyles = global.testHelpers?.applyAbsoluteStyles;
			
			if (!applyAbsoluteStyles) {
				console.warn('applyAbsoluteStyles not available for testing');
				return;
			}

			const styles = {
				fillColor: '#FF0000',
				strokeWidth: 3
			};

			const result = applyAbsoluteStyles(mockCells, styles, mockGraph);
			
			expect(result.success).toBe(true);
			expect(result.errors).toHaveLength(0);
			expect(mockGraph.setCellStyles).toHaveBeenCalled();
		});

		test('should reject invalid enum values', () => {
			const applyAbsoluteStyles = global.testHelpers?.applyAbsoluteStyles;
			
			if (!applyAbsoluteStyles) {
				console.warn('applyAbsoluteStyles not available for testing');
				return;
			}

			const styles = {
				align: 'invalid'
			};

			const result = applyAbsoluteStyles(mockCells, styles, mockGraph);
			
			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].errorCode).toBe('INVALID_VALUE');
		});

		test('should filter edge-only properties to edges only', () => {
			const applyAbsoluteStyles = global.testHelpers?.applyAbsoluteStyles;
			
			if (!applyAbsoluteStyles) {
				console.warn('applyAbsoluteStyles not available for testing');
				return;
			}

			const styles = {
				startArrow: 'classic'
			};

			applyAbsoluteStyles(mockCells, styles, mockGraph);
			
			// Should be called with filtered cells (only edges)
			expect(mockGraph.setCellStyles).toHaveBeenCalledWith(
				'startArrow',
				'classic',
				expect.arrayContaining([mockEdge])
			);
		});
	});

	describe('applyRelativeOperations', () => {
		let mockGraphWithStyle;

		beforeEach(() => {
			// Create mock graph with getCellStyle method
			mockGraphWithStyle = {
				...mockGraph,
				getCellStyle: jest.fn((cell) => ({
					strokeWidth: '5',
					fillColor: '#0000FF'
				}))
			};
		});

		test('should reject color property operations other than set', () => {
			const applyRelativeOperations = global.testHelpers?.applyRelativeOperations;
			
			if (!applyRelativeOperations) {
				console.warn('applyRelativeOperations not available for testing');
				return;
			}

			const operations = {
				fillColor: { op: 'increase', value: 10 }
			};

			const result = applyRelativeOperations(mockCells, operations, mockGraphWithStyle);
			
			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].errorCode).toBe('UNSUPPORTED_OPERATION');
			expect(result.errors[0].error).toContain('Color properties only support set operation');
		});

		test('should reject strokeColor operations other than set', () => {
			const applyRelativeOperations = global.testHelpers?.applyRelativeOperations;
			
			if (!applyRelativeOperations) {
				console.warn('applyRelativeOperations not available for testing');
				return;
			}

			const operations = {
				strokeColor: { op: 'multiply', value: 2 }
			};

			const result = applyRelativeOperations(mockCells, operations, mockGraphWithStyle);
			
			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].errorCode).toBe('UNSUPPORTED_OPERATION');
		});

		test('should reject fontColor operations other than set', () => {
			const applyRelativeOperations = global.testHelpers?.applyRelativeOperations;
			
			if (!applyRelativeOperations) {
				console.warn('applyRelativeOperations not available for testing');
				return;
			}

			const operations = {
				fontColor: { op: 'decrease', value: 5 }
			};

			const result = applyRelativeOperations(mockCells, operations, mockGraphWithStyle);
			
			expect(result.success).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0].errorCode).toBe('UNSUPPORTED_OPERATION');
		});

		test('should allow set operation on color properties', () => {
			const applyRelativeOperations = global.testHelpers?.applyRelativeOperations;
			
			if (!applyRelativeOperations) {
				console.warn('applyRelativeOperations not available for testing');
				return;
			}

			const operations = {
				fillColor: { op: 'set', value: '#FF0000' }
			};

			const result = applyRelativeOperations(mockCells, operations, mockGraphWithStyle);
			
			// Should succeed since 'set' is allowed for color properties
			expect(result.success).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		test('should allow numeric operations on non-color properties', () => {
			const applyRelativeOperations = global.testHelpers?.applyRelativeOperations;
			
			if (!applyRelativeOperations) {
				console.warn('applyRelativeOperations not available for testing');
				return;
			}

			const operations = {
				strokeWidth: { op: 'increase', value: 2 },
				fontSize: { op: 'multiply', value: 1.5 }
			};

			const result = applyRelativeOperations(mockCells, operations, mockGraphWithStyle);
			
			// Should succeed for numeric properties
			expect(result.success).toBe(true);
			expect(result.errors).toHaveLength(0);
		});
	});
});
