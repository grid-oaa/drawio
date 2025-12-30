/**
 * Custom assertion helpers for testing
 */

/**
 * Assert that a response message has the correct format
 * @param {Object} response - The response message
 * @param {string} expectedStatus - Expected status ('ok' or 'error')
 */
function assertResponseFormat(response, expectedStatus) {
  expect(response).toBeDefined();
  expect(response).toHaveProperty('event', 'generateMermaid');
  expect(response).toHaveProperty('status', expectedStatus);
  
  if (expectedStatus === 'error') {
    expect(response).toHaveProperty('error');
    expect(response).toHaveProperty('errorCode');
    expect(typeof response.error).toBe('string');
    expect(typeof response.errorCode).toBe('string');
  } else {
    expect(response.error).toBeUndefined();
  }
}

/**
 * Assert that a message was sent via postMessage
 * @param {Object} mockSource - Mock source object with postMessage
 * @param {Object} expectedData - Expected message data
 */
function assertPostMessageCalled(mockSource, expectedData) {
  expect(mockSource.postMessage).toHaveBeenCalled();
  
  if (expectedData) {
    const calls = mockSource.postMessage.mock.calls;
    const lastCall = calls[calls.length - 1];
    const sentData = typeof lastCall[0] === 'string' ? 
      JSON.parse(lastCall[0]) : lastCall[0];
    
    expect(sentData).toMatchObject(expectedData);
  }
}

/**
 * Assert that validation failed with specific error
 * @param {Object} validationResult - Result from validateMessage
 * @param {string} expectedErrorCode - Expected error code
 */
function assertValidationFailed(validationResult, expectedErrorCode) {
  expect(validationResult).toBeDefined();
  expect(validationResult.valid).toBe(false);
  expect(validationResult.errorCode).toBe(expectedErrorCode);
  expect(validationResult.error).toBeDefined();
  expect(typeof validationResult.error).toBe('string');
}

/**
 * Assert that validation succeeded
 * @param {Object} validationResult - Result from validateMessage
 */
function assertValidationSucceeded(validationResult) {
  expect(validationResult).toBeDefined();
  expect(validationResult.valid).toBe(true);
  expect(validationResult.error).toBeUndefined();
  expect(validationResult.errorCode).toBeUndefined();
}

/**
 * Assert that cells were inserted into the graph
 * @param {Object} mockUI - Mock UI object
 * @param {number} expectedCount - Expected number of cells (optional)
 */
function assertCellsInserted(mockUI, expectedCount) {
  expect(mockUI.importXml).toHaveBeenCalled();
  
  if (expectedCount !== undefined) {
    const result = mockUI.importXml.mock.results[0].value;
    expect(result).toHaveLength(expectedCount);
  }
}

/**
 * Assert that the graph was modified
 * @param {Object} mockUI - Mock UI object
 */
function assertGraphModified(mockUI) {
  expect(mockUI.editor.setModified).toHaveBeenCalledWith(true);
}

/**
 * Assert that cells were selected
 * @param {Object} mockUI - Mock UI object
 * @param {Array} expectedCells - Expected cells (optional)
 */
function assertCellsSelected(mockUI, expectedCells) {
  expect(mockUI.editor.graph.setSelectionCells).toHaveBeenCalled();
  
  if (expectedCells) {
    expect(mockUI.editor.graph.setSelectionCells)
      .toHaveBeenCalledWith(expectedCells);
  }
}

/**
 * Assert that a log message was recorded
 * @param {Object} mockConsole - Mock console object
 * @param {string} level - Log level ('log', 'error', 'warn', etc.)
 * @param {string} messagePattern - Pattern to match in the message
 */
function assertLogMessage(mockConsole, level, messagePattern) {
  expect(mockConsole[level]).toHaveBeenCalled();
  
  if (messagePattern) {
    const calls = mockConsole[level].mock.calls;
    const found = calls.some(call => 
      call.some(arg => 
        typeof arg === 'string' && arg.includes(messagePattern)
      )
    );
    expect(found).toBe(true);
  }
}

/**
 * Assert that an error was logged
 * @param {Object} mockConsole - Mock console object
 * @param {string} errorPattern - Pattern to match in the error message
 */
function assertErrorLogged(mockConsole, errorPattern) {
  assertLogMessage(mockConsole, 'error', errorPattern);
}

module.exports = {
  assertResponseFormat,
  assertPostMessageCalled,
  assertValidationFailed,
  assertValidationSucceeded,
  assertCellsInserted,
  assertGraphModified,
  assertCellsSelected,
  assertLogMessage,
  assertErrorLogged
};
