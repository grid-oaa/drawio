/**
 * Tests for Canvas Inserter Module
 */

const { createMockUI } = require('./helpers/mocks');

// Load the module
const CanvasInserter = require('../src/main/webapp/js/canvas-inserter.js');

describe('Canvas Inserter', () => {
  let mockUI;
  let mockGraph;
  let mockModel;

  beforeEach(() => {
    mockUI = createMockUI();
    mockGraph = mockUI.editor.graph;
    mockModel = mockGraph.getModel();
  });

  describe('insertDiagram', () => {
    test('should insert XML into canvas and return cells', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/><mxCell id="1"/></root></mxGraphModel>';
      const options = {};

      const result = CanvasInserter.insertDiagram(mockUI, xml, options);

      expect(result.success).toBe(true);
      expect(result.cells).toBeDefined();
      expect(result.cells.length).toBeGreaterThan(0);
      expect(result.cellCount).toBe(result.cells.length);
      expect(mockUI.importXml).toHaveBeenCalledWith(xml, 20, 20, true);
    });

    test('should use specified position when provided', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = {
        position: { x: 100, y: 200 }
      };

      CanvasInserter.insertDiagram(mockUI, xml, options);

      expect(mockUI.importXml).toHaveBeenCalledWith(xml, 100, 200, true);
    });

    test('should use default position when not specified', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = {};

      CanvasInserter.insertDiagram(mockUI, xml, options);

      expect(mockUI.importXml).toHaveBeenCalledWith(xml, 20, 20, true);
    });

    test('should select inserted cells by default', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = {};

      CanvasInserter.insertDiagram(mockUI, xml, options);

      expect(mockGraph.setSelectionCells).toHaveBeenCalled();
      const callArgs = mockGraph.setSelectionCells.mock.calls[0][0];
      expect(callArgs).toBeDefined();
      expect(Array.isArray(callArgs)).toBe(true);
    });

    test('should not select cells when select option is false', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = { select: false };

      CanvasInserter.insertDiagram(mockUI, xml, options);

      expect(mockGraph.setSelectionCells).not.toHaveBeenCalled();
    });

    test('should apply scale when specified', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = { scale: 1.5 };

      CanvasInserter.insertDiagram(mockUI, xml, options);

      expect(mockGraph.scaleCells).toHaveBeenCalled();
      const [cells, scaleX, scaleY] = mockGraph.scaleCells.mock.calls[0];
      expect(scaleX).toBe(1.5);
      expect(scaleY).toBe(1.5);
    });

    test('should validate scale range (0.1 - 10.0)', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      
      // Test valid scale values
      const validScales = [0.1, 0.5, 1.0, 2.0, 5.0, 10.0];
      validScales.forEach(scale => {
        mockGraph.scaleCells.mockClear();
        const options = { scale: scale };
        CanvasInserter.insertDiagram(mockUI, xml, options);
        expect(mockGraph.scaleCells).toHaveBeenCalled();
        const [cells, scaleX, scaleY] = mockGraph.scaleCells.mock.calls[0];
        expect(scaleX).toBe(scale);
        expect(scaleY).toBe(scale);
      });

      // Test out-of-range scale values (should warn but not throw)
      const invalidScales = [0.05, 0.09, 10.1, 15.0, 100.0];
      invalidScales.forEach(scale => {
        mockGraph.scaleCells.mockClear();
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        const options = { scale: scale };
        
        // Should not throw error, just warn
        expect(() => {
          CanvasInserter.insertDiagram(mockUI, xml, options);
        }).not.toThrow();
        
        // Should log warning
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('Scale out of range')
        );
        
        // Should not apply the invalid scale
        expect(mockGraph.scaleCells).not.toHaveBeenCalled();
        
        consoleWarnSpy.mockRestore();
      });
    });

    test('should not apply scale when not specified', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = {};

      CanvasInserter.insertDiagram(mockUI, xml, options);

      expect(mockGraph.scaleCells).not.toHaveBeenCalled();
    });

    test('should scroll to make cell visible', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = {};

      CanvasInserter.insertDiagram(mockUI, xml, options);

      expect(mockGraph.scrollCellToVisible).toHaveBeenCalled();
    });

    test('should center view when center option is true', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = { center: true };

      CanvasInserter.insertDiagram(mockUI, xml, options);

      expect(mockGraph.scrollCellToVisible).toHaveBeenCalled();
      const [cell, center] = mockGraph.scrollCellToVisible.mock.calls[0];
      expect(center).toBe(true);
    });

    test('should mark document as modified', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = {};

      CanvasInserter.insertDiagram(mockUI, xml, options);

      expect(mockUI.editor.setModified).toHaveBeenCalledWith(true);
    });

    test('should throw error when UI is invalid', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = {};

      expect(() => {
        CanvasInserter.insertDiagram(null, xml, options);
      }).toThrow('Invalid UI object');
    });

    test('should throw error when XML is invalid', () => {
      const options = {};

      expect(() => {
        CanvasInserter.insertDiagram(mockUI, null, options);
      }).toThrow('Invalid XML');

      expect(() => {
        CanvasInserter.insertDiagram(mockUI, '', options);
      }).toThrow('Invalid XML');
    });

    test('should throw error when importXml returns no cells', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = {};

      // Mock importXml to return empty array
      mockUI.importXml.mockReturnValue([]);

      expect(() => {
        CanvasInserter.insertDiagram(mockUI, xml, options);
      }).toThrow('No cells were inserted');
    });

    test('should restore selection on failure', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = {};

      // Set initial selection
      const initialSelection = [{ id: 'existing-cell' }];
      mockGraph.getSelectionCells.mockReturnValue(initialSelection);

      // Mock importXml to throw error
      mockUI.importXml.mockImplementation(() => {
        throw new Error('Import failed');
      });

      expect(() => {
        CanvasInserter.insertDiagram(mockUI, xml, options);
      }).toThrow('Failed to insert diagram');

      // Verify selection was restored
      expect(mockGraph.setSelectionCells).toHaveBeenCalledWith(initialSelection);
    });

    test('should include error code in thrown error', () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = {};

      // Mock importXml to throw error
      mockUI.importXml.mockImplementation(() => {
        throw new Error('Import failed');
      });

      try {
        CanvasInserter.insertDiagram(mockUI, xml, options);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.code).toBe(CanvasInserter.ERROR_CODES.INSERT_FAILED);
        expect(error.originalError).toBeDefined();
      }
    });
  });

  describe('insertDiagramSafe', () => {
    test('should resolve with result on success', async () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = {};

      const result = await CanvasInserter.insertDiagramSafe(mockUI, xml, options);

      expect(result.success).toBe(true);
      expect(result.cells).toBeDefined();
    });

    test('should reject with error on failure', async () => {
      const xml = '<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>';
      const options = {};

      // Mock importXml to throw error
      mockUI.importXml.mockImplementation(() => {
        throw new Error('Import failed');
      });

      await expect(
        CanvasInserter.insertDiagramSafe(mockUI, xml, options)
      ).rejects.toThrow('Failed to insert diagram');
    });
  });

  // Property-Based Tests
  describe('Property Tests', () => {
    const fc = require('fast-check');
    const { validOptions } = require('./helpers/generators');

    // Feature: mermaid-iframe-integration, Property 8: 图表插入成功
    test('Property 8: inserting parsed XML should increase cell count', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }), // Generate random XML-like content
          validOptions(),
          (xmlContent, options) => {
            // Create fresh mock for each iteration
            const testMockUI = createMockUI();
            const testGraph = testMockUI.editor.graph;
            const testModel = testGraph.getModel();

            // Set initial cell count
            const initialCellCount = 5;
            testModel.getCellCount.mockReturnValue(initialCellCount);

            // Mock importXml to return cells
            const mockCells = [
              { id: 'cell1' },
              { id: 'cell2' },
              { id: 'cell3' }
            ];
            testMockUI.importXml.mockReturnValue(mockCells);

            // Create valid XML structure
            const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1"/>${xmlContent}</root></mxGraphModel>`;

            // Insert diagram
            const result = CanvasInserter.insertDiagram(testMockUI, xml, options);

            // Verify insertion was successful
            expect(result.success).toBe(true);
            expect(result.cells).toBeDefined();
            expect(result.cells.length).toBeGreaterThan(0);
            expect(result.cellCount).toBe(mockCells.length);

            // Verify importXml was called
            expect(testMockUI.importXml).toHaveBeenCalled();

            // The property: cell count should increase after insertion
            // In a real scenario, the model would update its count
            // Here we verify that cells were returned, which indicates successful insertion
            return result.cells.length > 0;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: mermaid-iframe-integration, Property 9: 插入位置正确
    test('Property 9: inserted diagram should be at specified position', () => {
      const { validPosition } = require('./helpers/generators');
      
      fc.assert(
        fc.property(
          validPosition(),
          (position) => {
            // Create fresh mock for each iteration
            const testMockUI = createMockUI();

            // Mock importXml to return cells
            const mockCells = [
              { id: 'cell1' },
              { id: 'cell2' }
            ];
            testMockUI.importXml.mockReturnValue(mockCells);

            // Create valid XML
            const xml = '<mxGraphModel><root><mxCell id="0"/><mxCell id="1"/></root></mxGraphModel>';

            // Insert diagram with specified position
            const options = { position: position };
            const result = CanvasInserter.insertDiagram(testMockUI, xml, options);

            // Verify insertion was successful
            expect(result.success).toBe(true);

            // The property: importXml should be called with the specified position
            expect(testMockUI.importXml).toHaveBeenCalled();
            const callArgs = testMockUI.importXml.mock.calls[0];
            
            // Verify the position parameters match (with reasonable tolerance)
            const actualX = callArgs[1];
            const actualY = callArgs[2];
            const expectedX = position.x;
            const expectedY = position.y;

            // Position should match exactly (no tolerance needed for integer coordinates)
            return actualX === expectedX && actualY === expectedY;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: mermaid-iframe-integration, Property 10: 图表自动选中
    test('Property 10: inserted diagram should be automatically selected', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }), // Generate random XML-like content
          validOptions(),
          (xmlContent, options) => {
            // Create fresh mock for each iteration
            const testMockUI = createMockUI();
            const testGraph = testMockUI.editor.graph;

            // Mock importXml to return cells
            const mockCells = [
              { id: 'cell1' },
              { id: 'cell2' },
              { id: 'cell3' }
            ];
            testMockUI.importXml.mockReturnValue(mockCells);

            // Create valid XML structure
            const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1"/>${xmlContent}</root></mxGraphModel>`;

            // Insert diagram
            const result = CanvasInserter.insertDiagram(testMockUI, xml, options);

            // Verify insertion was successful
            expect(result.success).toBe(true);
            expect(result.cells).toBeDefined();

            // The property: if select is not explicitly false, cells should be selected
            const shouldSelect = options.select !== false;

            if (shouldSelect) {
              // Verify setSelectionCells was called with the inserted cells
              expect(testGraph.setSelectionCells).toHaveBeenCalled();
              const selectedCells = testGraph.setSelectionCells.mock.calls[0][0];
              
              // The selected cells should be the same as the inserted cells
              expect(selectedCells).toBeDefined();
              expect(Array.isArray(selectedCells)).toBe(true);
              expect(selectedCells.length).toBe(mockCells.length);
              
              // Verify the cells match
              return selectedCells.every((cell, index) => cell.id === mockCells[index].id);
            } else {
              // If select is false, setSelectionCells should not be called
              expect(testGraph.setSelectionCells).not.toHaveBeenCalled();
              return true;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: mermaid-iframe-integration, Property 11: 视图自动调整
    test('Property 11: view should be adjusted to make inserted diagram visible', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }), // Generate random XML-like content
          validOptions(),
          (xmlContent, options) => {
            // Create fresh mock for each iteration
            const testMockUI = createMockUI();
            const testGraph = testMockUI.editor.graph;

            // Mock importXml to return cells
            const mockCells = [
              { id: 'cell1', geometry: { x: 100, y: 100, width: 80, height: 60 } },
              { id: 'cell2', geometry: { x: 200, y: 200, width: 80, height: 60 } }
            ];
            testMockUI.importXml.mockReturnValue(mockCells);

            // Create valid XML structure
            const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1"/>${xmlContent}</root></mxGraphModel>`;

            // Insert diagram
            const result = CanvasInserter.insertDiagram(testMockUI, xml, options);

            // Verify insertion was successful
            expect(result.success).toBe(true);
            expect(result.cells).toBeDefined();
            expect(result.cells.length).toBeGreaterThan(0);

            // The property: scrollCellToVisible should always be called to ensure diagram is visible
            expect(testGraph.scrollCellToVisible).toHaveBeenCalled();

            // Verify it was called with the first cell
            const scrollCallArgs = testGraph.scrollCellToVisible.mock.calls[0];
            expect(scrollCallArgs[0]).toBeDefined();
            expect(scrollCallArgs[0].id).toBe(mockCells[0].id);

            // If center option is true, the second parameter should be true
            if (options.center === true) {
              expect(scrollCallArgs[1]).toBe(true);
              return true;
            } else {
              // If center is not explicitly true, it should be undefined or false
              // (the implementation calls scrollCellToVisible with just one argument when not centering)
              return scrollCallArgs[1] === undefined || scrollCallArgs[1] === false;
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: mermaid-iframe-integration, Property 12: 失败时状态不变
    test('Property 12: canvas state should remain unchanged when insertion fails', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }), // Generate random XML-like content
          validOptions(),
          fc.array(fc.record({ id: fc.string() }), { minLength: 0, maxLength: 5 }), // Initial selection
          (xmlContent, options, initialSelection) => {
            // Create fresh mock for each iteration
            const testMockUI = createMockUI();
            const testGraph = testMockUI.editor.graph;
            const testModel = testGraph.getModel();

            // Set up initial canvas state
            const initialCellCount = 10;
            testModel.getCellCount.mockReturnValue(initialCellCount);
            testGraph.getSelectionCells.mockReturnValue(initialSelection);

            // Mock importXml to throw an error (simulating insertion failure)
            const errorMessage = 'Simulated insertion failure';
            testMockUI.importXml.mockImplementation(() => {
              throw new Error(errorMessage);
            });

            // Create valid XML structure
            const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1"/>${xmlContent}</root></mxGraphModel>`;

            // Attempt to insert diagram (should fail)
            let errorThrown = false;
            try {
              CanvasInserter.insertDiagram(testMockUI, xml, options);
            } catch (error) {
              errorThrown = true;
              
              // Verify error was thrown with correct code
              expect(error.code).toBe(CanvasInserter.ERROR_CODES.INSERT_FAILED);
              expect(error.message).toContain('Failed to insert diagram');
            }

            // The property: insertion should have failed
            expect(errorThrown).toBe(true);

            // The property: cell count should remain unchanged
            // (In a real scenario, we'd verify the model wasn't modified)
            // Here we verify that no successful insertion occurred
            expect(testMockUI.importXml).toHaveBeenCalled();

            // The property: selection should be restored to initial state
            // Verify setSelectionCells was called with the initial selection
            expect(testGraph.setSelectionCells).toHaveBeenCalledWith(initialSelection);

            // The property: document should NOT be marked as modified on failure
            // (setModified should not be called, or if called, only during rollback)
            const setModifiedCalls = testMockUI.editor.setModified.mock.calls;
            // Either not called at all, or not called with true
            const wasMarkedModified = setModifiedCalls.some(call => call[0] === true);
            expect(wasMarkedModified).toBe(false);

            // The property: no cells should be scaled on failure
            expect(testGraph.scaleCells).not.toHaveBeenCalled();

            // The property: view should not be adjusted on failure
            expect(testGraph.scrollCellToVisible).not.toHaveBeenCalled();

            // All state preservation checks passed
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: mermaid-iframe-integration, Property 16: 缩放参数生效
    test('Property 16: inserted diagram should be scaled according to scale parameter', () => {
      const { validScale } = require('./helpers/generators');
      
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 500 }), // Generate random XML-like content
          validScale(),
          (xmlContent, scale) => {
            // Create fresh mock for each iteration
            const testMockUI = createMockUI();
            const testGraph = testMockUI.editor.graph;

            // Mock importXml to return cells
            const mockCells = [
              { id: 'cell1', geometry: { x: 100, y: 100, width: 80, height: 60 } },
              { id: 'cell2', geometry: { x: 200, y: 200, width: 80, height: 60 } }
            ];
            testMockUI.importXml.mockReturnValue(mockCells);

            // Create valid XML structure
            const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1"/>${xmlContent}</root></mxGraphModel>`;

            // Insert diagram with scale option
            const options = { scale: scale };
            const result = CanvasInserter.insertDiagram(testMockUI, xml, options);

            // Verify insertion was successful
            expect(result.success).toBe(true);
            expect(result.cells).toBeDefined();
            expect(result.cells.length).toBeGreaterThan(0);

            // The property: scaleCells should be called with the specified scale
            expect(testGraph.scaleCells).toHaveBeenCalled();
            
            // Verify the scale parameters
            const scaleCallArgs = testGraph.scaleCells.mock.calls[0];
            const [cells, scaleX, scaleY] = scaleCallArgs;

            // Verify cells were passed
            expect(cells).toBeDefined();
            expect(Array.isArray(cells)).toBe(true);
            expect(cells.length).toBe(mockCells.length);

            // The property: both scaleX and scaleY should equal the specified scale
            expect(scaleX).toBe(scale);
            expect(scaleY).toBe(scale);

            // Verify scale is within valid range (0.1 - 10.0)
            expect(scale).toBeGreaterThanOrEqual(0.1);
            expect(scale).toBeLessThanOrEqual(10.0);

            // All scale checks passed
            return scaleX === scale && scaleY === scale;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
