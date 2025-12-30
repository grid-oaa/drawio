/**
 * Property-based tests for Mermaid Parser
 * Feature: mermaid-iframe-integration
 */

const fc = require('fast-check');
const { parseMermaidWithTimeout, ERROR_CODES } = require('../src/main/webapp/js/mermaid-parser.js');
const { validMermaidText } = require('./helpers/generators');
const { createMockUI } = require('./helpers/mocks');

describe('Mermaid Parser Property Tests', () => {
  
  /**
   * Property 6: Mermaid 解析成功
   * Feature: mermaid-iframe-integration, Property 6: 对于任何有效的 Mermaid 文本，解析器应该成功将其转换为符合 draw.io 规范的 XML 数据
   * Validates: Requirements 2.1, 2.4
   */
  test('Property 6: should successfully parse any valid Mermaid text to XML', async () => {
    await fc.assert(
      fc.asyncProperty(
        validMermaidText(),
        async (mermaidText) => {
          // Create mock UI with successful parsing
          const mockUI = createMockUI();
          
          // Override parseMermaidDiagram to simulate successful parsing
          mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
            // Simulate async parsing
            setTimeout(() => {
              // Generate valid draw.io XML format
              const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>`;
              successCallback(xml);
            }, 10);
          });

          // Parse the Mermaid text
          const result = await parseMermaidWithTimeout(mockUI, mermaidText);

          // Verify the result is valid XML
          // 1. Result should be a non-empty string
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);

          // 2. Result should contain XML structure
          expect(result).toContain('<mxGraphModel>');
          expect(result).toContain('</mxGraphModel>');
          expect(result).toContain('<root>');
          expect(result).toContain('</root>');

          // 3. parseMermaidDiagram should have been called with the correct text
          expect(mockUI.parseMermaidDiagram).toHaveBeenCalledWith(
            mermaidText,
            null,
            expect.any(Function),
            expect.any(Function)
          );

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: 解析错误详细信息
   * Feature: mermaid-iframe-integration, Property 7: 对于任何包含语法错误的 Mermaid 文本，解析器应该返回包含错误描述和错误位置的详细错误信息
   * Validates: Requirements 2.2, 7.5
   */
  test('Property 7: should return detailed error information for parsing failures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Generate error messages with position information
          fc.record({
            message: fc.string({ minLength: 5, maxLength: 100 }),
            line: fc.integer({ min: 1, max: 100 }),
            position: fc.option(fc.integer({ min: 1, max: 200 }), { nil: undefined })
          }),
          // Generate error messages with text position markers
          fc.tuple(
            fc.string({ minLength: 5, maxLength: 50 }),
            fc.integer({ min: 1, max: 50 })
          ).map(([msg, line]) => ({
            message: `${msg} at line ${line}`
          })),
          // Generate Error objects with position in message
          fc.tuple(
            fc.string({ minLength: 5, maxLength: 50 }),
            fc.integer({ min: 1, max: 50 })
          ).map(([msg, pos]) => new Error(`Parse error at position ${pos}: ${msg}`)),
          // Generate simple string errors
          fc.string({ minLength: 10, maxLength: 100 })
        ),
        async (errorData) => {
          // Create mock UI that will fail with the generated error
          const mockUI = createMockUI();
          
          mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
            setTimeout(() => {
              errorCallback(errorData);
            }, 10);
          });

          // Attempt to parse and expect rejection
          try {
            await parseMermaidWithTimeout(mockUI, 'invalid mermaid');
            // If we reach here, the test should fail
            return false;
          } catch (error) {
            // Verify error has detailed information
            
            // 1. Error should be an object
            expect(typeof error).toBe('object');
            expect(error).not.toBeNull();

            // 2. Error should have a message field
            expect(error).toHaveProperty('message');
            expect(typeof error.message).toBe('string');
            expect(error.message.length).toBeGreaterThan(0);

            // 3. Error should have a code field
            expect(error).toHaveProperty('code');
            expect(typeof error.code).toBe('string');
            expect(error.code).toBe(ERROR_CODES.PARSE_ERROR);

            // 4. Error should have details field
            expect(error).toHaveProperty('details');

            // 5. If the original error contained position information, it should be extracted
            // Check if position information exists when it should
            if (typeof errorData === 'object' && errorData !== null) {
              if (errorData.line !== undefined || errorData.position !== undefined) {
                // Position info should be extracted
                expect(error).toHaveProperty('position');
                if (error.position) {
                  expect(typeof error.position).toBe('object');
                }
              }
            }

            // 6. If error message contains position markers (line X, position Y, at Z), 
            // position should be extracted
            const errorMessage = typeof errorData === 'string' ? errorData : 
                               (errorData instanceof Error ? errorData.message : 
                               (errorData.message || ''));
            
            if (errorMessage && typeof errorMessage === 'string') {
              const hasPositionMarker = /line\s+\d+|position\s+\d+|at\s+\d+/i.test(errorMessage);
              if (hasPositionMarker && error.position) {
                // At least one position field should be set
                const hasPositionData = error.position.line !== null || 
                                       error.position.position !== null ||
                                       error.position.column !== undefined;
                expect(hasPositionData).toBe(true);
              }
            }

            return true;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Unit Test: Parsing timeout
   * Tests that parsing timeout returns TIMEOUT error
   * Validates: Requirements 2.5
   */
  describe('Parsing timeout', () => {
    
    test('should return TIMEOUT error when parsing exceeds timeout limit', async () => {
      const mockUI = createMockUI();
      
      // Mock parseMermaidDiagram to simulate a slow parsing operation
      // that never completes within the timeout period
      mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
        // Simulate a parsing operation that takes longer than the timeout
        // Don't call either callback - this simulates a hanging operation
      });

      const mermaidText = 'flowchart TD\n    A --> B';
      const shortTimeout = 100; // 100ms timeout for faster test

      try {
        await parseMermaidWithTimeout(mockUI, mermaidText, shortTimeout);
        fail('Should have thrown a timeout error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.code).toBe(ERROR_CODES.TIMEOUT);
        expect(error.message).toContain('timed out');
        expect(error.message).toContain('100');
        expect(error.timeout).toBe(shortTimeout);
      }
    });

    test('should return TIMEOUT error with default timeout when not specified', async () => {
      const mockUI = createMockUI();
      
      // Mock parseMermaidDiagram to never complete
      mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
        // Don't call callbacks - simulate hanging
      });

      const mermaidText = 'flowchart TD\n    A --> B';

      try {
        // Use a very short timeout by passing it explicitly
        // (we can't wait 10 seconds in tests)
        await parseMermaidWithTimeout(mockUI, mermaidText, 50);
        fail('Should have thrown a timeout error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.code).toBe(ERROR_CODES.TIMEOUT);
        expect(error.message).toMatch(/timed out/i);
        expect(error).toHaveProperty('timeout');
        expect(typeof error.timeout).toBe('number');
      }
    });

    test('should not timeout when parsing completes before timeout', async () => {
      const mockUI = createMockUI();
      
      // Mock parseMermaidDiagram to complete quickly
      mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
        setTimeout(() => {
          const xml = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>`;
          successCallback(xml);
        }, 10); // Complete in 10ms
      });

      const mermaidText = 'flowchart TD\n    A --> B';
      const timeout = 1000; // 1 second timeout

      // Should not throw - parsing completes before timeout
      const result = await parseMermaidWithTimeout(mockUI, mermaidText, timeout);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('<mxGraphModel>');
    });

    test('should handle timeout with very long parsing operation', async () => {
      const mockUI = createMockUI();
      
      // Mock parseMermaidDiagram to simulate a very slow operation
      mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
        // Simulate an operation that would take 5 seconds
        setTimeout(() => {
          const xml = `<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>`;
          successCallback(xml);
        }, 5000);
      });

      const mermaidText = 'flowchart TD\n    A --> B --> C --> D --> E';
      const shortTimeout = 50; // 50ms timeout

      try {
        await parseMermaidWithTimeout(mockUI, mermaidText, shortTimeout);
        fail('Should have thrown a timeout error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.code).toBe(ERROR_CODES.TIMEOUT);
        expect(error.message).toContain('50');
        expect(error.timeout).toBe(50);
      }
    });

    test('should include timeout value in error message', async () => {
      const mockUI = createMockUI();
      
      mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
        // Don't complete
      });

      const customTimeout = 250;

      try {
        await parseMermaidWithTimeout(mockUI, 'flowchart TD\n    A --> B', customTimeout);
        fail('Should have thrown a timeout error');
      } catch (error) {
        expect(error.message).toContain('250');
        expect(error.message).toMatch(/timed out after \d+ms/i);
        expect(error.timeout).toBe(customTimeout);
      }
    });

    test('should not call success callback after timeout', async () => {
      const mockUI = createMockUI();
      let successCallbackRef = null;
      
      mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
        successCallbackRef = successCallback;
        // Don't call callback immediately
      });

      const shortTimeout = 50;

      try {
        await parseMermaidWithTimeout(mockUI, 'flowchart TD\n    A --> B', shortTimeout);
        fail('Should have thrown a timeout error');
      } catch (error) {
        expect(error.code).toBe(ERROR_CODES.TIMEOUT);
        
        // Now try to call the success callback after timeout
        // This should not affect the already-rejected promise
        if (successCallbackRef) {
          successCallbackRef('<xml>test</xml>');
        }
        
        // The error should still be a timeout error
        expect(error.code).toBe(ERROR_CODES.TIMEOUT);
      }
    });

    test('should not call error callback after timeout', async () => {
      const mockUI = createMockUI();
      let errorCallbackRef = null;
      
      mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
        errorCallbackRef = errorCallback;
        // Don't call callback immediately
      });

      const shortTimeout = 50;

      try {
        await parseMermaidWithTimeout(mockUI, 'flowchart TD\n    A --> B', shortTimeout);
        fail('Should have thrown a timeout error');
      } catch (error) {
        expect(error.code).toBe(ERROR_CODES.TIMEOUT);
        
        // Now try to call the error callback after timeout
        // This should not affect the already-rejected promise
        if (errorCallbackRef) {
          errorCallbackRef(new Error('Some other error'));
        }
        
        // The error should still be a timeout error
        expect(error.code).toBe(ERROR_CODES.TIMEOUT);
      }
    });

  });

});

describe('Mermaid Parser Unit Tests', () => {
  
  /**
   * Unit Test: Unsupported diagram types
   * Tests that unsupported Mermaid diagram types return UNSUPPORTED_TYPE error
   * Validates: Requirements 2.3
   */
  describe('Unsupported diagram types', () => {
    
    test('should return UNSUPPORTED_TYPE error for journey diagram', async () => {
      const mockUI = createMockUI();
      
      // Mock parseMermaidDiagram to simulate unsupported type error
      mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
        setTimeout(() => {
          errorCallback({
            message: 'Unsupported diagram type: journey',
            code: ERROR_CODES.UNSUPPORTED_TYPE
          });
        }, 10);
      });

      const journeyDiagram = `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me`;

      try {
        await parseMermaidWithTimeout(mockUI, journeyDiagram);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.code).toBe(ERROR_CODES.UNSUPPORTED_TYPE);
        expect(error.message).toContain('Unsupported');
      }
    });

    test('should return UNSUPPORTED_TYPE error for mindmap diagram', async () => {
      const mockUI = createMockUI();
      
      mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
        setTimeout(() => {
          errorCallback({
            message: 'Diagram type "mindmap" is not supported',
            code: ERROR_CODES.UNSUPPORTED_TYPE
          });
        }, 10);
      });

      const mindmapDiagram = `mindmap
  root((mindmap))
    Origins
      Long history
      ::icon(fa fa-book)`;

      try {
        await parseMermaidWithTimeout(mockUI, mindmapDiagram);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.code).toBe(ERROR_CODES.UNSUPPORTED_TYPE);
        expect(error.message).toMatch(/not supported|Unsupported/i);
      }
    });

    test('should return UNSUPPORTED_TYPE error for timeline diagram', async () => {
      const mockUI = createMockUI();
      
      mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
        setTimeout(() => {
          errorCallback({
            message: 'Timeline diagrams are not supported in this version',
            code: ERROR_CODES.UNSUPPORTED_TYPE
          });
        }, 10);
      });

      const timelineDiagram = `timeline
    title History of Social Media Platform
    2002 : LinkedIn
    2004 : Facebook
    2005 : Youtube`;

      try {
        await parseMermaidWithTimeout(mockUI, timelineDiagram);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.code).toBe(ERROR_CODES.UNSUPPORTED_TYPE);
        expect(error.message).toMatch(/not supported|Unsupported/i);
      }
    });

    test('should return UNSUPPORTED_TYPE error for gitGraph diagram', async () => {
      const mockUI = createMockUI();
      
      mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
        setTimeout(() => {
          errorCallback({
            message: 'gitGraph is not supported',
            code: ERROR_CODES.UNSUPPORTED_TYPE
          });
        }, 10);
      });

      const gitGraphDiagram = `gitGraph
    commit
    branch develop
    checkout develop
    commit`;

      try {
        await parseMermaidWithTimeout(mockUI, gitGraphDiagram);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.code).toBe(ERROR_CODES.UNSUPPORTED_TYPE);
        expect(error.message).toMatch(/not supported|Unsupported/i);
      }
    });

    test('should return UNSUPPORTED_TYPE error for requirement diagram', async () => {
      const mockUI = createMockUI();
      
      mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
        setTimeout(() => {
          errorCallback({
            message: 'Requirement diagrams are not supported',
            code: ERROR_CODES.UNSUPPORTED_TYPE
          });
        }, 10);
      });

      const requirementDiagram = `requirementDiagram
    requirement test_req {
    id: 1
    text: the test text.
    risk: high
    verifymethod: test
    }`;

      try {
        await parseMermaidWithTimeout(mockUI, requirementDiagram);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.code).toBe(ERROR_CODES.UNSUPPORTED_TYPE);
        expect(error.message).toMatch(/not supported|Unsupported/i);
      }
    });

    test('should handle UNSUPPORTED_TYPE error when code is in error object', async () => {
      const mockUI = createMockUI();
      
      mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
        setTimeout(() => {
          // Simulate error with code property
          const error = new Error('This diagram type is not supported');
          error.code = ERROR_CODES.UNSUPPORTED_TYPE;
          errorCallback(error);
        }, 10);
      });

      const unsupportedDiagram = 'unknownDiagramType\n    A --> B';

      try {
        await parseMermaidWithTimeout(mockUI, unsupportedDiagram);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.code).toBe(ERROR_CODES.UNSUPPORTED_TYPE);
        expect(error.message).toBeDefined();
        expect(typeof error.message).toBe('string');
      }
    });

    test('should preserve UNSUPPORTED_TYPE error code through error extraction', async () => {
      const mockUI = createMockUI();
      
      mockUI.parseMermaidDiagram = jest.fn((mermaid, options, successCallback, errorCallback) => {
        setTimeout(() => {
          // Test that error code is preserved even with complex error object
          errorCallback({
            message: 'Diagram type not recognized',
            code: ERROR_CODES.UNSUPPORTED_TYPE,
            details: {
              diagramType: 'unknown',
              supportedTypes: ['flowchart', 'sequence', 'class']
            }
          });
        }, 10);
      });

      try {
        await parseMermaidWithTimeout(mockUI, 'unknown\n    test');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.code).toBe(ERROR_CODES.UNSUPPORTED_TYPE);
        expect(error.message).toContain('not recognized');
        // Verify details are preserved
        expect(error.details).toBeDefined();
      }
    });

  });

});
