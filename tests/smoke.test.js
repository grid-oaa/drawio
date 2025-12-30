/**
 * Smoke test to verify testing framework setup
 */

const fc = require('fast-check');
const {
  createMockUI,
  createMockMessageEvent,
  createMockWindow,
  createValidRequest
} = require('./helpers/mocks');
const {
  validMermaidText,
  validGenerateMermaidRequest
} = require('./helpers/generators');
const {
  assertResponseFormat,
  assertValidationSucceeded
} = require('./helpers/assertions');

describe('Testing Framework Smoke Tests', () => {
  describe('Jest Configuration', () => {
    test('should run basic test', () => {
      expect(true).toBe(true);
    });

    test('should have jsdom environment', () => {
      expect(typeof window).toBe('object');
      expect(typeof document).toBe('object');
    });

    test('should support async tests', async () => {
      const result = await Promise.resolve(42);
      expect(result).toBe(42);
    });
  });

  describe('fast-check Integration', () => {
    test('should run property-based test', () => {
      fc.assert(
        fc.property(fc.integer(), (n) => {
          return n + 0 === n;
        }),
        { numRuns: 100 }
      );
    });

    test('should generate valid mermaid text', () => {
      fc.assert(
        fc.property(validMermaidText(), (mermaid) => {
          return typeof mermaid === 'string' && mermaid.length > 0;
        }),
        { numRuns: 100 }
      );
    });

    test('should generate valid requests', () => {
      fc.assert(
        fc.property(validGenerateMermaidRequest(), (request) => {
          return (
            request.action === 'generateMermaid' &&
            typeof request.mermaid === 'string' &&
            request.mermaid.length > 0
          );
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Mock Objects', () => {
    test('should create mock UI', () => {
      const mockUI = createMockUI();
      expect(mockUI).toBeDefined();
      expect(mockUI.editor).toBeDefined();
      expect(mockUI.editor.graph).toBeDefined();
      expect(typeof mockUI.parseMermaidDiagram).toBe('function');
      expect(typeof mockUI.importXml).toBe('function');
    });

    test('should create mock message event', () => {
      const data = createValidRequest();
      const event = createMockMessageEvent(data);
      expect(event).toBeDefined();
      expect(event.data).toEqual(data);
      expect(event.origin).toBe('https://example.com');
      expect(event.source).toBeDefined();
      expect(typeof event.source.postMessage).toBe('function');
    });

    test('should create mock window', () => {
      const mockWindow = createMockWindow();
      expect(mockWindow).toBeDefined();
      expect(typeof mockWindow.addEventListener).toBe('function');
      expect(typeof mockWindow.postMessage).toBe('function');
    });
  });

  describe('Custom Assertions', () => {
    test('should validate response format for success', () => {
      const response = {
        event: 'generateMermaid',
        status: 'ok'
      };
      assertResponseFormat(response, 'ok');
    });

    test('should validate response format for error', () => {
      const response = {
        event: 'generateMermaid',
        status: 'error',
        error: 'Test error',
        errorCode: 'TEST_ERROR'
      };
      assertResponseFormat(response, 'error');
    });

    test('should validate successful validation result', () => {
      const result = {
        valid: true
      };
      assertValidationSucceeded(result);
    });
  });

  describe('Helper Functions', () => {
    test('should create valid request', () => {
      const request = createValidRequest();
      expect(request).toHaveProperty('action', 'generateMermaid');
      expect(request).toHaveProperty('mermaid');
      expect(typeof request.mermaid).toBe('string');
    });

    test('should create valid request with options', () => {
      const request = createValidRequest('flowchart TD\n    A --> B', {
        position: { x: 100, y: 100 },
        scale: 1.5
      });
      expect(request.options).toBeDefined();
      expect(request.options.position).toEqual({ x: 100, y: 100 });
      expect(request.options.scale).toBe(1.5);
    });
  });

  describe('Custom Matchers', () => {
    test('should validate message format with custom matcher', () => {
      const validMessage = {
        action: 'generateMermaid',
        mermaid: 'flowchart TD\n    A --> B'
      };
      expect(validMessage).toBeValidMessageFormat();
    });

    test('should reject invalid message format', () => {
      const invalidMessage = null;
      expect(invalidMessage).not.toBeValidMessageFormat();
    });
  });
});
