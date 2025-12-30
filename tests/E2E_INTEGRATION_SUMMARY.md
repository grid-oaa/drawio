# End-to-End Integration Test Summary

## Overview

This document summarizes the end-to-end (E2E) integration tests for the Mermaid iframe integration feature. These tests validate the complete message processing flow from receiving a message to sending a response.

## Test Coverage

### Total Tests: 21

The E2E tests cover the following scenarios:

## 1. Successful Flow (5 tests)

Tests that verify the complete happy path from message receipt to successful response:

- **Complete flow test**: Validates the entire pipeline (receive → validate → parse → insert → respond)
- **All options test**: Verifies that all optional parameters (position, scale, select, center) are correctly applied
- **Multiple diagram types**: Tests different Mermaid diagram types (flowchart, sequence, class, state, ER)
- **Select option**: Verifies the `select: false` option prevents automatic selection
- **Empty options**: Tests default behavior when options object is empty

## 2. Validation Failure Flow (4 tests)

Tests that verify proper handling of invalid messages:

- **Missing mermaid field**: Validates rejection of messages without the required mermaid field
- **Empty mermaid field**: Validates rejection of empty string mermaid values
- **Whitespace-only mermaid**: Validates rejection of whitespace-only mermaid text
- **Wrong mermaid type**: Validates rejection of non-string mermaid values

## 3. Parsing Failure Flow (3 tests)

Tests that verify proper handling of Mermaid parsing errors:

- **Parsing errors**: Validates graceful handling of syntax errors
- **Line number in error**: Verifies that error messages include line number information when available
- **Parsing timeout**: Tests timeout handling (though actual timeout is not triggered in tests)

## 4. Insertion Failure Flow (3 tests)

Tests that verify proper handling of canvas insertion errors:

- **Insertion errors**: Validates graceful handling of insertion failures (e.g., locked canvas)
- **Null cells**: Verifies error handling when insertion returns null
- **Empty cells array**: Verifies error handling when insertion returns empty array

## 5. Complex Scenarios (3 tests)

Tests that verify behavior in complex real-world scenarios:

- **Rapid successive messages**: Tests handling of multiple messages sent in quick succession
- **Complex options**: Tests handling of messages with all options specified
- **State isolation**: Verifies that state is properly isolated between different messages

## 6. Response Message Format (3 tests)

Tests that verify correct response message formatting:

- **Correct origin**: Validates that responses are sent to the correct origin
- **Success response fields**: Verifies all required fields in success responses
- **Error response fields**: Verifies all required fields in error responses

## Key Features Tested

### Message Processing Pipeline

1. **Message Reception**: Tests verify that messages are correctly received and parsed
2. **Validation**: Tests verify that all validation rules are applied correctly
3. **Parsing**: Tests verify that Mermaid text is correctly parsed to XML
4. **Insertion**: Tests verify that XML is correctly inserted into the canvas
5. **Response**: Tests verify that responses are correctly formatted and sent

### Error Handling

- **Validation errors**: Immediate rejection with appropriate error codes
- **Parsing errors**: Graceful handling with detailed error messages
- **Insertion errors**: Proper rollback and error reporting
- **State preservation**: Canvas state is preserved on failure

### Options Handling

- **Position**: Custom insertion position (x, y coordinates)
- **Scale**: Diagram scaling (0.1 - 10.0)
- **Select**: Automatic selection of inserted cells
- **Center**: View centering on inserted diagram

### Response Format

All responses include:
- `event`: Always "generateMermaid"
- `status`: Either "ok" or "error"
- `data`: Additional data for success responses (e.g., cellCount)
- `error`: Error message for error responses
- `errorCode`: Error code for error responses

## Requirements Validated

These tests validate **Requirement 4.5**: End-to-end message processing flow

The tests ensure that:
1. Valid messages are processed successfully through the entire pipeline
2. Invalid messages are rejected at the appropriate stage
3. Errors are handled gracefully at each stage
4. Responses are correctly formatted and sent to the right destination
5. State is properly managed throughout the process

## Test Execution

All tests use:
- **Jest** as the test framework
- **Mock objects** for UI, graph, and message events
- **Async/await** for handling asynchronous operations
- **Custom assertions** for validating response formats

### Running the Tests

```bash
# Run all E2E tests
npm test -- tests/e2e.test.js

# Run all tests
npm test
```

## Test Results

✅ All 21 E2E integration tests pass
✅ All 199 total tests pass (including unit and property-based tests)
✅ Complete coverage of the message processing pipeline
✅ Comprehensive error handling validation
✅ Full options and response format validation

## Related Test Files

- `tests/messageHandler.test.js` - Unit tests for message handler
- `tests/pluginIntegration.test.js` - Plugin integration tests
- `tests/messageValidation.test.js` - Property-based validation tests
- `tests/mermaidParser.test.js` - Parser tests
- `tests/canvasInserter.test.js` - Canvas insertion tests
- `tests/sendResponse.test.js` - Response sending tests

## Conclusion

The end-to-end integration tests provide comprehensive coverage of the complete message processing flow, ensuring that all components work correctly together and that the system handles both success and failure scenarios gracefully.
