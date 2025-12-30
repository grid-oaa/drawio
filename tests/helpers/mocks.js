/**
 * Mock objects and helper functions for testing Mermaid iframe integration
 */

/**
 * Create a mock MessageEvent object
 * @param {Object} data - The message data
 * @param {string} origin - The origin of the message
 * @returns {Object} Mock MessageEvent
 */
function createMockMessageEvent(data, origin = 'https://example.com') {
  const mockSource = {
    postMessage: jest.fn()
  };

  return {
    data: data,
    origin: origin,
    source: mockSource,
    type: 'message'
  };
}

/**
 * Create a mock draw.io UI object
 * @returns {Object} Mock UI object
 */
function createMockUI() {
  const mockGraph = {
    getModel: jest.fn(() => ({
      getCellCount: jest.fn(() => 0),
      beginUpdate: jest.fn(),
      endUpdate: jest.fn()
    })),
    setSelectionCells: jest.fn(),
    getSelectionCells: jest.fn(() => []),
    scaleCells: jest.fn(),
    scrollCellToVisible: jest.fn()
  };

  const mockEditor = {
    graph: mockGraph,
    setModified: jest.fn()
  };

  return {
    editor: mockEditor,
    parseMermaidDiagram: jest.fn((mermaid, options, successCallback, errorCallback) => {
      // Default mock implementation - can be overridden in tests
      if (mermaid && mermaid.trim().length > 0) {
        setTimeout(() => successCallback('<mxGraphModel><root><mxCell id="0"/></root></mxGraphModel>'), 0);
      } else {
        setTimeout(() => errorCallback(new Error('Empty mermaid text')), 0);
      }
    }),
    importXml: jest.fn((xml, dx, dy, crop) => {
      // Return mock cells
      return [{ id: 'cell1' }, { id: 'cell2' }];
    }),
    setFileData: jest.fn()
  };
}

/**
 * Create a mock window object with postMessage support
 * @returns {Object} Mock window object
 */
function createMockWindow() {
  const listeners = {};
  
  return {
    addEventListener: jest.fn((event, handler) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(handler);
    }),
    removeEventListener: jest.fn((event, handler) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(h => h !== handler);
      }
    }),
    postMessage: jest.fn(),
    parent: {
      postMessage: jest.fn()
    },
    // Helper to trigger events
    _triggerEvent: (event, data) => {
      if (listeners[event]) {
        listeners[event].forEach(handler => handler(data));
      }
    },
    _getListeners: () => listeners
  };
}

/**
 * Create a mock performance object for timing tests
 * @returns {Object} Mock performance object
 */
function createMockPerformance() {
  let currentTime = 0;
  
  return {
    now: jest.fn(() => {
      currentTime += 10; // Increment by 10ms each call
      return currentTime;
    }),
    _reset: () => {
      currentTime = 0;
    }
  };
}

/**
 * Create a mock console object for logging tests
 * @returns {Object} Mock console object
 */
function createMockConsole() {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  };
}

/**
 * Wait for async operations to complete
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise}
 */
function wait(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a valid generateMermaid request message
 * @param {string} mermaid - Mermaid text
 * @param {Object} options - Optional parameters
 * @returns {Object} Request message
 */
function createValidRequest(mermaid = 'flowchart TD\n    A --> B', options = {}) {
  return {
    action: 'generateMermaid',
    mermaid: mermaid,
    options: options
  };
}

/**
 * Create an invalid request message (for testing validation)
 * @param {string} type - Type of invalid message
 * @returns {Object} Invalid request message
 */
function createInvalidRequest(type = 'missing-action') {
  switch (type) {
    case 'missing-action':
      return { mermaid: 'flowchart TD\n    A --> B' };
    case 'missing-mermaid':
      return { action: 'generateMermaid' };
    case 'empty-mermaid':
      return { action: 'generateMermaid', mermaid: '' };
    case 'whitespace-mermaid':
      return { action: 'generateMermaid', mermaid: '   \n\t  ' };
    case 'wrong-type':
      return { action: 'generateMermaid', mermaid: 123 };
    default:
      return {};
  }
}

module.exports = {
  createMockMessageEvent,
  createMockUI,
  createMockWindow,
  createMockPerformance,
  createMockConsole,
  wait,
  createValidRequest,
  createInvalidRequest
};
