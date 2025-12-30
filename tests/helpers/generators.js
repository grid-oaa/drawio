/**
 * fast-check generators for property-based testing
 * These generators create random test data for comprehensive testing
 */

const fc = require('fast-check');

/**
 * Generate valid Mermaid text
 * @returns {fc.Arbitrary<string>}
 */
function validMermaidText() {
  return fc.oneof(
    // Flowchart
    fc.constant('flowchart TD\n    A --> B'),
    fc.constant('flowchart LR\n    Start --> End'),
    // Sequence diagram
    fc.constant('sequenceDiagram\n    Alice->>Bob: Hello'),
    // Class diagram
    fc.constant('classDiagram\n    Class01 <|-- Class02'),
    // State diagram
    fc.constant('stateDiagram-v2\n    [*] --> State1'),
    // ER diagram
    fc.constant('erDiagram\n    CUSTOMER ||--o{ ORDER : places'),
    // Gantt chart
    fc.constant('gantt\n    title A Gantt Diagram\n    section Section\n    A task :a1, 2014-01-01, 30d'),
    // Pie chart
    fc.constant('pie title Pets\n    "Dogs" : 386\n    "Cats" : 85'),
    // Custom flowchart with random nodes
    fc.tuple(
      fc.integer({ min: 2, max: 5 }),
      fc.constantFrom('TD', 'LR', 'RL', 'BT')
    ).map(([nodeCount, direction]) => {
      let diagram = `flowchart ${direction}\n`;
      for (let i = 0; i < nodeCount - 1; i++) {
        diagram += `    Node${i} --> Node${i + 1}\n`;
      }
      return diagram;
    })
  );
}

/**
 * Generate invalid Mermaid text (syntax errors)
 * @returns {fc.Arbitrary<string>}
 */
function invalidMermaidText() {
  return fc.oneof(
    fc.constant('flowchart TD\n    A --> '), // Incomplete
    fc.constant('invalid syntax here'),
    fc.constant('flowchart\n    '), // Missing direction
    fc.constant('sequenceDiagram\n    Alice->>'), // Incomplete
    fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
      !s.includes('flowchart') && 
      !s.includes('sequenceDiagram') &&
      !s.includes('classDiagram')
    )
  );
}

/**
 * Generate empty or whitespace-only strings
 * @returns {fc.Arbitrary<string>}
 */
function emptyOrWhitespace() {
  return fc.oneof(
    fc.constant(''),
    fc.constant(' '),
    fc.constant('   '),
    fc.constant('\n'),
    fc.constant('\t'),
    fc.constant('  \n\t  '),
    fc.stringOf(fc.constantFrom(' ', '\n', '\t', '\r'))
  );
}

/**
 * Generate valid message origins
 * @returns {fc.Arbitrary<string>}
 */
function validOrigin() {
  return fc.oneof(
    fc.constant('https://example.com'),
    fc.constant('https://app.example.com'),
    fc.constant('http://localhost:3000'),
    fc.constant('http://localhost:8080'),
    fc.webUrl()
  );
}

/**
 * Generate potentially malicious origins
 * @returns {fc.Arbitrary<string>}
 */
function maliciousOrigin() {
  return fc.oneof(
    fc.constant('https://evil.com'),
    fc.constant('http://malicious-site.net'),
    fc.constant('javascript:alert(1)'),
    fc.constant('data:text/html,<script>alert(1)</script>')
  );
}

/**
 * Generate valid position options
 * @returns {fc.Arbitrary<Object>}
 */
function validPosition() {
  return fc.record({
    x: fc.integer({ min: 0, max: 2000 }),
    y: fc.integer({ min: 0, max: 2000 })
  });
}

/**
 * Generate valid scale values
 * @returns {fc.Arbitrary<number>}
 */
function validScale() {
  return fc.double({ min: 0.1, max: 10.0, noNaN: true });
}

/**
 * Generate invalid scale values
 * @returns {fc.Arbitrary<number>}
 */
function invalidScale() {
  return fc.oneof(
    fc.double({ min: -10, max: 0, noNaN: true }),
    fc.double({ min: 10.1, max: 100, noNaN: true }),
    fc.constant(NaN),
    fc.constant(Infinity),
    fc.constant(-Infinity)
  );
}

/**
 * Generate valid options object
 * @returns {fc.Arbitrary<Object>}
 */
function validOptions() {
  return fc.record({
    position: fc.option(validPosition(), { nil: undefined }),
    scale: fc.option(validScale(), { nil: undefined }),
    select: fc.option(fc.boolean(), { nil: undefined }),
    center: fc.option(fc.boolean(), { nil: undefined })
  }, { requiredKeys: [] });
}

/**
 * Generate valid generateMermaid request
 * @returns {fc.Arbitrary<Object>}
 */
function validGenerateMermaidRequest() {
  return fc.record({
    action: fc.constant('generateMermaid'),
    mermaid: validMermaidText(),
    options: fc.option(validOptions(), { nil: undefined })
  });
}

/**
 * Generate invalid generateMermaid request
 * @returns {fc.Arbitrary<Object>}
 */
function invalidGenerateMermaidRequest() {
  return fc.oneof(
    // Missing action
    fc.record({
      mermaid: validMermaidText()
    }),
    // Missing mermaid
    fc.record({
      action: fc.constant('generateMermaid')
    }),
    // Empty mermaid
    fc.record({
      action: fc.constant('generateMermaid'),
      mermaid: emptyOrWhitespace()
    }),
    // Wrong action type
    fc.record({
      action: fc.string().filter(s => s !== 'generateMermaid'),
      mermaid: validMermaidText()
    }),
    // Wrong mermaid type
    fc.record({
      action: fc.constant('generateMermaid'),
      mermaid: fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined))
    })
  );
}

/**
 * Generate XSS attack vectors
 * @returns {fc.Arbitrary<string>}
 */
function xssAttackVector() {
  return fc.oneof(
    fc.constant('<script>alert("XSS")</script>'),
    fc.constant('javascript:alert(1)'),
    fc.constant('<img src=x onerror=alert(1)>'),
    fc.constant('<iframe src="javascript:alert(1)"></iframe>'),
    fc.constant('onclick="alert(1)"'),
    fc.constant('onload="alert(1)"'),
    fc.constant('<svg onload=alert(1)>'),
    fc.constant('flowchart TD\n    A[<script>alert(1)</script>] --> B')
  );
}

/**
 * Generate large messages (for DoS testing)
 * @returns {fc.Arbitrary<string>}
 */
function largeMessage() {
  return fc.string({ minLength: 1024 * 1024, maxLength: 2 * 1024 * 1024 }); // 1-2 MB
}

/**
 * Generate error codes
 * @returns {fc.Arbitrary<string>}
 */
function errorCode() {
  return fc.constantFrom(
    'INVALID_FORMAT',
    'EMPTY_MERMAID',
    'PARSE_ERROR',
    'UNSUPPORTED_TYPE',
    'TIMEOUT',
    'INSERT_FAILED',
    'ORIGIN_DENIED',
    'SIZE_EXCEEDED',
    'XSS_DETECTED'
  );
}

module.exports = {
  validMermaidText,
  invalidMermaidText,
  emptyOrWhitespace,
  validOrigin,
  maliciousOrigin,
  validPosition,
  validScale,
  invalidScale,
  validOptions,
  validGenerateMermaidRequest,
  invalidGenerateMermaidRequest,
  xssAttackVector,
  largeMessage,
  errorCode
};
