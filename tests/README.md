# Mermaid iframe Integration Tests

This directory contains the test suite for the Mermaid iframe integration feature in draw.io.

## Structure

```
tests/
├── setup.js                 # Jest setup and global configuration
├── helpers/
│   ├── mocks.js            # Mock objects (UI, MessageEvent, Window, etc.)
│   ├── generators.js       # fast-check generators for property-based testing
│   └── assertions.js       # Custom assertion helpers
└── [test files will be added in subsequent tasks]
```

## Running Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Types

### Unit Tests
- Test specific examples and edge cases
- Verify error conditions
- Test integration points between components

### Property-Based Tests
- Use fast-check to generate random test data
- Verify universal properties across all inputs
- Each property test runs 100+ iterations

## Writing Tests

### Using Mocks

```javascript
const { createMockUI, createMockMessageEvent } = require('./helpers/mocks');

test('example test', () => {
  const mockUI = createMockUI();
  const mockEvent = createMockMessageEvent({ action: 'generateMermaid', mermaid: 'flowchart TD\n    A --> B' });
  // ... test code
});
```

### Using Generators

```javascript
const fc = require('fast-check');
const { validMermaidText } = require('./helpers/generators');

test('property test example', () => {
  fc.assert(
    fc.property(validMermaidText(), (mermaid) => {
      // Test that property holds for all valid mermaid text
      return true;
    }),
    { numRuns: 100 }
  );
});
```

### Using Assertions

```javascript
const { assertResponseFormat, assertValidationSucceeded } = require('./helpers/assertions');

test('assertion example', () => {
  const response = { event: 'generateMermaid', status: 'ok' };
  assertResponseFormat(response, 'ok');
});
```

## Coverage Goals

- Target: 80% code coverage
- All 19 correctness properties must have corresponding tests
- All testable acceptance criteria must be covered

## Test Naming Convention

- Unit tests: `[component].[function].test.js`
- Property tests: Include property number in test name
- Format: `Feature: mermaid-iframe-integration, Property {number}: {property_text}`

## References

- Design Document: `.kiro/specs/mermaid-iframe-integration/design.md`
- Requirements: `.kiro/specs/mermaid-iframe-integration/requirements.md`
- Tasks: `.kiro/specs/mermaid-iframe-integration/tasks.md`
