/**
 * Tests for sendResponse function
 * Feature: mermaid-iframe-integration
 * Tests response message construction and sending
 */

const { createMockMessageEvent, createValidRequest } = require('./helpers/mocks');

// Load the validator module
require('../src/main/webapp/js/mermaid-validator.js');

describe('sendResponse Function', () => {
  let mockEvent;
  let originalConsoleError;
  let originalConsoleLog;

  beforeEach(() => {
    // Create a fresh mock event for each test
    mockEvent = createMockMessageEvent(
      createValidRequest(),
      'https://example.com'
    );

    // Spy on console methods
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    console.error = jest.fn();
    console.log = jest.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  describe('Success Response', () => {
    test('should send success response with correct format', () => {
      // Act
      window.MermaidValidator.sendResponse(mockEvent, true);

      // Assert
      expect(mockEvent.source.postMessage).toHaveBeenCalledTimes(1);
      
      const sentMessage = mockEvent.source.postMessage.mock.calls[0][0];
      const parsedMessage = JSON.parse(sentMessage);
      
      expect(parsedMessage).toEqual({
        event: 'generateMermaid',
        status: 'ok'
      });
    });

    test('should send success response with additional data', () => {
      // Arrange
      const additionalData = { cellCount: 5 };

      // Act
      window.MermaidValidator.sendResponse(mockEvent, true, null, null, additionalData);

      // Assert
      expect(mockEvent.source.postMessage).toHaveBeenCalledTimes(1);
      
      const sentMessage = mockEvent.source.postMessage.mock.calls[0][0];
      const parsedMessage = JSON.parse(sentMessage);
      
      expect(parsedMessage).toEqual({
        event: 'generateMermaid',
        status: 'ok',
        data: { cellCount: 5 }
      });
    });

    test('should send response to correct origin', () => {
      // Act
      window.MermaidValidator.sendResponse(mockEvent, true);

      // Assert
      const targetOrigin = mockEvent.source.postMessage.mock.calls[0][1];
      expect(targetOrigin).toBe('https://example.com');
    });
  });

  describe('Error Response', () => {
    test('should send error response with error message and code', () => {
      // Arrange
      const errorMessage = 'Invalid mermaid syntax';
      const errorCode = 'PARSE_ERROR';

      // Act
      window.MermaidValidator.sendResponse(mockEvent, false, errorMessage, errorCode);

      // Assert
      expect(mockEvent.source.postMessage).toHaveBeenCalledTimes(1);
      
      const sentMessage = mockEvent.source.postMessage.mock.calls[0][0];
      const parsedMessage = JSON.parse(sentMessage);
      
      expect(parsedMessage).toEqual({
        event: 'generateMermaid',
        status: 'error',
        error: errorMessage,
        errorCode: errorCode
      });
    });

    test('should send error response with only error message', () => {
      // Arrange
      const errorMessage = 'Something went wrong';

      // Act
      window.MermaidValidator.sendResponse(mockEvent, false, errorMessage);

      // Assert
      const sentMessage = mockEvent.source.postMessage.mock.calls[0][0];
      const parsedMessage = JSON.parse(sentMessage);
      
      expect(parsedMessage).toEqual({
        event: 'generateMermaid',
        status: 'error',
        error: errorMessage
      });
    });

    test('should send error response with only error code', () => {
      // Arrange
      const errorCode = 'TIMEOUT';

      // Act
      window.MermaidValidator.sendResponse(mockEvent, false, null, errorCode);

      // Assert
      const sentMessage = mockEvent.source.postMessage.mock.calls[0][0];
      const parsedMessage = JSON.parse(sentMessage);
      
      expect(parsedMessage).toEqual({
        event: 'generateMermaid',
        status: 'error',
        errorCode: errorCode
      });
    });
  });

  describe('Exception Handling', () => {
    test('should handle postMessage exception gracefully', () => {
      // Arrange
      mockEvent.source.postMessage = jest.fn(() => {
        throw new Error('postMessage failed');
      });

      // Act
      window.MermaidValidator.sendResponse(mockEvent, true);

      // Assert - should not throw, but should log error
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send response'),
        expect.any(Error)
      );
    });

    test('should handle missing event source', () => {
      // Arrange
      const invalidEvent = { origin: 'https://example.com' };

      // Act
      window.MermaidValidator.sendResponse(invalidEvent, true);

      // Assert - should log error and not throw
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Cannot send response: invalid event or missing source')
      );
    });

    test('should handle null event', () => {
      // Act
      window.MermaidValidator.sendResponse(null, true);

      // Assert - should log error and not throw
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Cannot send response: invalid event or missing source')
      );
    });
  });

  describe('Debug Mode', () => {
    test('should log success message in debug mode', () => {
      // Arrange
      const originalDebugMode = window.MermaidValidator.CONFIG.DEBUG_MODE;
      window.MermaidValidator.CONFIG.DEBUG_MODE = true;

      // Act
      window.MermaidValidator.sendResponse(mockEvent, true);

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Response sent successfully'),
        expect.any(Object)
      );

      // Cleanup
      window.MermaidValidator.CONFIG.DEBUG_MODE = originalDebugMode;
    });

    test('should not log success message when debug mode is off', () => {
      // Arrange
      const originalDebugMode = window.MermaidValidator.CONFIG.DEBUG_MODE;
      window.MermaidValidator.CONFIG.DEBUG_MODE = false;

      // Act
      window.MermaidValidator.sendResponse(mockEvent, true);

      // Assert
      expect(console.log).not.toHaveBeenCalled();

      // Cleanup
      window.MermaidValidator.CONFIG.DEBUG_MODE = originalDebugMode;
    });
  });

  describe('Message Format', () => {
    test('should always include event field with value "generateMermaid"', () => {
      // Act - test both success and error
      window.MermaidValidator.sendResponse(mockEvent, true);
      const successMessage = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);

      mockEvent.source.postMessage.mockClear();
      window.MermaidValidator.sendResponse(mockEvent, false, 'error', 'ERROR_CODE');
      const errorMessage = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);

      // Assert
      expect(successMessage.event).toBe('generateMermaid');
      expect(errorMessage.event).toBe('generateMermaid');
    });

    test('should always include status field', () => {
      // Act - test both success and error
      window.MermaidValidator.sendResponse(mockEvent, true);
      const successMessage = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);

      mockEvent.source.postMessage.mockClear();
      window.MermaidValidator.sendResponse(mockEvent, false, 'error', 'ERROR_CODE');
      const errorMessage = JSON.parse(mockEvent.source.postMessage.mock.calls[0][0]);

      // Assert
      expect(successMessage.status).toBe('ok');
      expect(errorMessage.status).toBe('error');
    });

    test('should serialize response as JSON string', () => {
      // Act
      window.MermaidValidator.sendResponse(mockEvent, true);

      // Assert
      const sentMessage = mockEvent.source.postMessage.mock.calls[0][0];
      expect(typeof sentMessage).toBe('string');
      expect(() => JSON.parse(sentMessage)).not.toThrow();
    });
  });

  describe('Property-Based Tests', () => {
    const fc = require('fast-check');
    const { errorCode, validOrigin } = require('./helpers/generators');

    /**
     * Feature: mermaid-iframe-integration, Property 13: 成功响应格式
     * Validates: Requirements 4.1, 5.3
     * 
     * For any successful operation, the system should send a response containing
     * event: 'generateMermaid' and status: 'ok' to the message sender.
     */
    test('Property 13: should send correctly formatted success response for any valid data', () => {
      fc.assert(
        fc.property(
          fc.option(
            fc.record({
              cellCount: fc.integer({ min: 0, max: 100 }),
              customField: fc.string()
            }),
            { nil: undefined }
          ),
          (additionalData) => {
            // Arrange
            const testEvent = createMockMessageEvent(
              createValidRequest(),
              'https://example.com'
            );

            // Act
            window.MermaidValidator.sendResponse(
              testEvent, 
              true, 
              null, 
              null, 
              additionalData
            );

            // Assert
            expect(testEvent.source.postMessage).toHaveBeenCalledTimes(1);
            
            const sentMessage = testEvent.source.postMessage.mock.calls[0][0];
            expect(typeof sentMessage).toBe('string');
            
            const parsedMessage = JSON.parse(sentMessage);
            
            // Must have event field with value 'generateMermaid'
            expect(parsedMessage).toHaveProperty('event', 'generateMermaid');
            
            // Must have status field with value 'ok'
            expect(parsedMessage).toHaveProperty('status', 'ok');
            
            // Should not have error or errorCode fields
            expect(parsedMessage.error).toBeUndefined();
            expect(parsedMessage.errorCode).toBeUndefined();
            
            // If additional data was provided, it should be included
            if (additionalData !== undefined) {
              expect(parsedMessage).toHaveProperty('data');
              expect(parsedMessage.data).toMatchObject(additionalData);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: mermaid-iframe-integration, Property 14: 错误响应格式
     * Validates: Requirements 4.2, 4.4, 5.3
     * 
     * For any failed operation, the system should send a response containing
     * event: 'generateMermaid', status: 'error', error message, and errorCode fields.
     */
    test('Property 14: should send correctly formatted error response for any error condition', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }), // error message
          errorCode(), // error code from predefined list
          (errorMessage, errorCodeValue) => {
            // Arrange
            const testEvent = createMockMessageEvent(
              createValidRequest(),
              'https://example.com'
            );

            // Act
            window.MermaidValidator.sendResponse(
              testEvent, 
              false, 
              errorMessage, 
              errorCodeValue
            );

            // Assert
            expect(testEvent.source.postMessage).toHaveBeenCalledTimes(1);
            
            const sentMessage = testEvent.source.postMessage.mock.calls[0][0];
            expect(typeof sentMessage).toBe('string');
            
            const parsedMessage = JSON.parse(sentMessage);
            
            // Must have event field with value 'generateMermaid'
            expect(parsedMessage).toHaveProperty('event', 'generateMermaid');
            
            // Must have status field with value 'error'
            expect(parsedMessage).toHaveProperty('status', 'error');
            
            // Must have error field with the provided error message
            expect(parsedMessage).toHaveProperty('error');
            expect(typeof parsedMessage.error).toBe('string');
            expect(parsedMessage.error).toBe(errorMessage);
            
            // Must have errorCode field with the provided error code
            expect(parsedMessage).toHaveProperty('errorCode');
            expect(typeof parsedMessage.errorCode).toBe('string');
            expect(parsedMessage.errorCode).toBe(errorCodeValue);
            
            // Should not have data field
            expect(parsedMessage.data).toBeUndefined();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Feature: mermaid-iframe-integration, Property 15: 响应目标正确
     * Validates: Requirements 4.3
     * 
     * For any response message, the system should send the response to the original
     * message's evt.source, ensuring the response reaches the correct sender.
     */
    test('Property 15: should send response to correct target source and origin', () => {
      fc.assert(
        fc.property(
          validOrigin(), // Generate random valid origins
          fc.boolean(), // Random success/failure
          fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined }), // Optional error message
          fc.option(errorCode(), { nil: undefined }), // Optional error code
          (origin, isSuccess, errorMessage, errorCodeValue) => {
            // Arrange - Create event with random origin
            const testEvent = createMockMessageEvent(
              createValidRequest(),
              origin
            );
            
            // Store reference to the original source
            const originalSource = testEvent.source;

            // Act
            window.MermaidValidator.sendResponse(
              testEvent, 
              isSuccess, 
              errorMessage, 
              errorCodeValue
            );

            // Assert - Response must be sent to the correct source
            expect(originalSource.postMessage).toHaveBeenCalledTimes(1);
            
            // Assert - Response must be sent with the correct origin
            const callArgs = originalSource.postMessage.mock.calls[0];
            expect(callArgs).toHaveLength(2);
            
            const sentMessage = callArgs[0];
            const targetOrigin = callArgs[1];
            
            // Verify the target origin matches the event origin
            expect(targetOrigin).toBe(origin);
            
            // Verify the message was sent (not null/undefined)
            expect(sentMessage).toBeDefined();
            expect(typeof sentMessage).toBe('string');
            
            // Verify the message can be parsed
            const parsedMessage = JSON.parse(sentMessage);
            expect(parsedMessage).toHaveProperty('event', 'generateMermaid');
            expect(parsedMessage).toHaveProperty('status');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
