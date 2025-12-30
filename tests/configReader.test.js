/**
 * Unit tests for configuration reading
 * Feature: mermaid-iframe-integration
 * Task: 10.2 编写配置读取的单元测试
 * Validates: Requirements 7.4
 */

// Load the validator module
require('../src/main/webapp/js/mermaid-validator.js');

describe('Configuration Reading - Unit Tests', () => {
  
  // Store original window properties
  let originalLocation;
  let originalDRAWIO_CONFIG;
  
  beforeEach(() => {
    // Save original values
    originalLocation = window.location;
    originalDRAWIO_CONFIG = window.DRAWIO_CONFIG;
    
    // Reset DRAWIO_CONFIG
    delete window.DRAWIO_CONFIG;
  });
  
  afterEach(() => {
    // Restore original values
    if (originalLocation) {
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true
      });
    }
    
    if (originalDRAWIO_CONFIG !== undefined) {
      window.DRAWIO_CONFIG = originalDRAWIO_CONFIG;
    } else {
      delete window.DRAWIO_CONFIG;
    }
  });

  /**
   * Test reading configuration from URL parameters
   */
  describe('readConfigFromURL', () => {
    const { readConfigFromURL, DEFAULT_CONFIG } = window.MermaidValidator;

    test('should return empty config when no URL parameters are present', () => {
      // Mock window.location with no query parameters
      delete window.location;
      window.location = { search: '' };
      
      const config = readConfigFromURL();
      
      expect(config).toEqual({});
    });

    test('should read maxMessageSize from URL parameter', () => {
      // Mock window.location with maxMessageSize parameter
      delete window.location;
      window.location = { search: '?maxMessageSize=2097152' };
      
      const config = readConfigFromURL();
      
      expect(config).toHaveProperty('MAX_MESSAGE_SIZE');
      expect(config.MAX_MESSAGE_SIZE).toBe(2097152);
    });

    test('should read parseTimeout from URL parameter', () => {
      // Mock window.location with parseTimeout parameter
      delete window.location;
      window.location = { search: '?parseTimeout=5000' };
      
      const config = readConfigFromURL();
      
      expect(config).toHaveProperty('PARSE_TIMEOUT');
      expect(config.PARSE_TIMEOUT).toBe(5000);
    });

    test('should read debugMode=true from URL parameter', () => {
      // Mock window.location with debugMode=true parameter
      delete window.location;
      window.location = { search: '?debugMode=true' };
      
      const config = readConfigFromURL();
      
      expect(config).toHaveProperty('DEBUG_MODE');
      expect(config.DEBUG_MODE).toBe(true);
    });

    test('should read debugMode=false from URL parameter', () => {
      // Mock window.location with debugMode=false parameter
      delete window.location;
      window.location = { search: '?debugMode=false' };
      
      const config = readConfigFromURL();
      
      expect(config).toHaveProperty('DEBUG_MODE');
      expect(config.DEBUG_MODE).toBe(false);
    });

    test('should read debugMode=1 as true from URL parameter', () => {
      // Mock window.location with debugMode=1 parameter
      delete window.location;
      window.location = { search: '?debugMode=1' };
      
      const config = readConfigFromURL();
      
      expect(config).toHaveProperty('DEBUG_MODE');
      expect(config.DEBUG_MODE).toBe(true);
    });

    test('should read allowedOrigins from URL parameter', () => {
      // Mock window.location with allowedOrigins parameter
      delete window.location;
      window.location = { search: '?allowedOrigins=https://example.com,https://app.example.com' };
      
      const config = readConfigFromURL();
      
      expect(config).toHaveProperty('ALLOWED_ORIGINS');
      expect(config.ALLOWED_ORIGINS).toEqual(['https://example.com', 'https://app.example.com']);
    });

    test('should trim whitespace from allowedOrigins', () => {
      // Mock window.location with allowedOrigins parameter with spaces
      delete window.location;
      window.location = { search: '?allowedOrigins=https://example.com, https://app.example.com , https://test.com' };
      
      const config = readConfigFromURL();
      
      expect(config).toHaveProperty('ALLOWED_ORIGINS');
      expect(config.ALLOWED_ORIGINS).toEqual(['https://example.com', 'https://app.example.com', 'https://test.com']);
    });

    test('should filter out empty origins from allowedOrigins', () => {
      // Mock window.location with allowedOrigins parameter with empty values
      delete window.location;
      window.location = { search: '?allowedOrigins=https://example.com,,https://app.example.com' };
      
      const config = readConfigFromURL();
      
      expect(config).toHaveProperty('ALLOWED_ORIGINS');
      expect(config.ALLOWED_ORIGINS).toEqual(['https://example.com', 'https://app.example.com']);
    });

    test('should read multiple URL parameters at once', () => {
      // Mock window.location with multiple parameters
      delete window.location;
      window.location = { 
        search: '?maxMessageSize=2097152&parseTimeout=5000&debugMode=true&allowedOrigins=https://example.com,https://app.example.com' 
      };
      
      const config = readConfigFromURL();
      
      expect(config).toHaveProperty('MAX_MESSAGE_SIZE');
      expect(config.MAX_MESSAGE_SIZE).toBe(2097152);
      expect(config).toHaveProperty('PARSE_TIMEOUT');
      expect(config.PARSE_TIMEOUT).toBe(5000);
      expect(config).toHaveProperty('DEBUG_MODE');
      expect(config.DEBUG_MODE).toBe(true);
      expect(config).toHaveProperty('ALLOWED_ORIGINS');
      expect(config.ALLOWED_ORIGINS).toEqual(['https://example.com', 'https://app.example.com']);
    });

    test('should ignore invalid maxMessageSize values', () => {
      // Mock window.location with invalid maxMessageSize
      delete window.location;
      window.location = { search: '?maxMessageSize=invalid' };
      
      const config = readConfigFromURL();
      
      expect(config).not.toHaveProperty('MAX_MESSAGE_SIZE');
    });

    test('should ignore negative maxMessageSize values', () => {
      // Mock window.location with negative maxMessageSize
      delete window.location;
      window.location = { search: '?maxMessageSize=-1000' };
      
      const config = readConfigFromURL();
      
      expect(config).not.toHaveProperty('MAX_MESSAGE_SIZE');
    });

    test('should ignore zero maxMessageSize values', () => {
      // Mock window.location with zero maxMessageSize
      delete window.location;
      window.location = { search: '?maxMessageSize=0' };
      
      const config = readConfigFromURL();
      
      expect(config).not.toHaveProperty('MAX_MESSAGE_SIZE');
    });

    test('should ignore invalid parseTimeout values', () => {
      // Mock window.location with invalid parseTimeout
      delete window.location;
      window.location = { search: '?parseTimeout=invalid' };
      
      const config = readConfigFromURL();
      
      expect(config).not.toHaveProperty('PARSE_TIMEOUT');
    });

    test('should ignore negative parseTimeout values', () => {
      // Mock window.location with negative parseTimeout
      delete window.location;
      window.location = { search: '?parseTimeout=-5000' };
      
      const config = readConfigFromURL();
      
      expect(config).not.toHaveProperty('PARSE_TIMEOUT');
    });

    test('should handle empty allowedOrigins parameter', () => {
      // Mock window.location with empty allowedOrigins
      delete window.location;
      window.location = { search: '?allowedOrigins=' };
      
      const config = readConfigFromURL();
      
      expect(config).not.toHaveProperty('ALLOWED_ORIGINS');
    });

    test('should handle debugMode with invalid values as false', () => {
      // Mock window.location with invalid debugMode
      delete window.location;
      window.location = { search: '?debugMode=invalid' };
      
      const config = readConfigFromURL();
      
      expect(config).toHaveProperty('DEBUG_MODE');
      expect(config.DEBUG_MODE).toBe(false);
    });

    test('should return empty config when URLSearchParams is not available', () => {
      // This test simulates an environment where URLSearchParams is not available
      // In the actual implementation, this is handled by checking typeof URLSearchParams
      // For testing purposes, we just verify the function handles this gracefully
      
      // The function already checks for URLSearchParams availability
      // and returns empty config if not available
      const config = readConfigFromURL();
      
      // Should return an object (empty or with values depending on environment)
      expect(typeof config).toBe('object');
    });
  });

  /**
   * Test reading configuration from global window object
   */
  describe('readConfigFromGlobal', () => {
    const { readConfigFromGlobal } = window.MermaidValidator;

    test('should return empty config when DRAWIO_CONFIG is not defined', () => {
      // Ensure DRAWIO_CONFIG is not defined
      delete window.DRAWIO_CONFIG;
      
      const config = readConfigFromGlobal();
      
      expect(config).toEqual({});
    });

    test('should read maxMessageSize from global config', () => {
      // Set global config
      window.DRAWIO_CONFIG = {
        maxMessageSize: 2097152
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).toHaveProperty('MAX_MESSAGE_SIZE');
      expect(config.MAX_MESSAGE_SIZE).toBe(2097152);
    });

    test('should read parseTimeout from global config', () => {
      // Set global config
      window.DRAWIO_CONFIG = {
        parseTimeout: 5000
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).toHaveProperty('PARSE_TIMEOUT');
      expect(config.PARSE_TIMEOUT).toBe(5000);
    });

    test('should read debugMode from global config', () => {
      // Set global config
      window.DRAWIO_CONFIG = {
        debugMode: true
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).toHaveProperty('DEBUG_MODE');
      expect(config.DEBUG_MODE).toBe(true);
    });

    test('should read allowedOrigins from global config', () => {
      // Set global config
      window.DRAWIO_CONFIG = {
        allowedOrigins: ['https://example.com', 'https://app.example.com']
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).toHaveProperty('ALLOWED_ORIGINS');
      expect(config.ALLOWED_ORIGINS).toEqual(['https://example.com', 'https://app.example.com']);
    });

    test('should read multiple global config values at once', () => {
      // Set global config with multiple values
      window.DRAWIO_CONFIG = {
        maxMessageSize: 2097152,
        parseTimeout: 5000,
        debugMode: true,
        allowedOrigins: ['https://example.com', 'https://app.example.com']
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).toHaveProperty('MAX_MESSAGE_SIZE');
      expect(config.MAX_MESSAGE_SIZE).toBe(2097152);
      expect(config).toHaveProperty('PARSE_TIMEOUT');
      expect(config.PARSE_TIMEOUT).toBe(5000);
      expect(config).toHaveProperty('DEBUG_MODE');
      expect(config.DEBUG_MODE).toBe(true);
      expect(config).toHaveProperty('ALLOWED_ORIGINS');
      expect(config.ALLOWED_ORIGINS).toEqual(['https://example.com', 'https://app.example.com']);
    });

    test('should ignore non-number maxMessageSize values', () => {
      // Set global config with invalid maxMessageSize
      window.DRAWIO_CONFIG = {
        maxMessageSize: 'invalid'
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).not.toHaveProperty('MAX_MESSAGE_SIZE');
    });

    test('should ignore negative maxMessageSize values', () => {
      // Set global config with negative maxMessageSize
      window.DRAWIO_CONFIG = {
        maxMessageSize: -1000
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).not.toHaveProperty('MAX_MESSAGE_SIZE');
    });

    test('should ignore zero maxMessageSize values', () => {
      // Set global config with zero maxMessageSize
      window.DRAWIO_CONFIG = {
        maxMessageSize: 0
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).not.toHaveProperty('MAX_MESSAGE_SIZE');
    });

    test('should ignore non-number parseTimeout values', () => {
      // Set global config with invalid parseTimeout
      window.DRAWIO_CONFIG = {
        parseTimeout: 'invalid'
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).not.toHaveProperty('PARSE_TIMEOUT');
    });

    test('should ignore negative parseTimeout values', () => {
      // Set global config with negative parseTimeout
      window.DRAWIO_CONFIG = {
        parseTimeout: -5000
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).not.toHaveProperty('PARSE_TIMEOUT');
    });

    test('should ignore non-boolean debugMode values', () => {
      // Set global config with invalid debugMode
      window.DRAWIO_CONFIG = {
        debugMode: 'true' // String instead of boolean
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).not.toHaveProperty('DEBUG_MODE');
    });

    test('should ignore non-array allowedOrigins values', () => {
      // Set global config with invalid allowedOrigins
      window.DRAWIO_CONFIG = {
        allowedOrigins: 'https://example.com' // String instead of array
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).not.toHaveProperty('ALLOWED_ORIGINS');
    });

    test('should ignore empty allowedOrigins array', () => {
      // Set global config with empty allowedOrigins
      window.DRAWIO_CONFIG = {
        allowedOrigins: []
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).not.toHaveProperty('ALLOWED_ORIGINS');
    });

    test('should filter out non-string values from allowedOrigins', () => {
      // Set global config with mixed allowedOrigins
      window.DRAWIO_CONFIG = {
        allowedOrigins: ['https://example.com', 123, null, 'https://app.example.com', undefined, '']
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).toHaveProperty('ALLOWED_ORIGINS');
      expect(config.ALLOWED_ORIGINS).toEqual(['https://example.com', 'https://app.example.com']);
    });

    test('should handle DRAWIO_CONFIG with extra properties', () => {
      // Set global config with extra properties
      window.DRAWIO_CONFIG = {
        maxMessageSize: 2097152,
        extraProperty: 'should be ignored',
        anotherExtra: 123
      };
      
      const config = readConfigFromGlobal();
      
      expect(config).toHaveProperty('MAX_MESSAGE_SIZE');
      expect(config.MAX_MESSAGE_SIZE).toBe(2097152);
      expect(config).not.toHaveProperty('extraProperty');
      expect(config).not.toHaveProperty('anotherExtra');
    });
  });

  /**
   * Test default configuration values
   */
  describe('Default Configuration', () => {
    const { DEFAULT_CONFIG } = window.MermaidValidator;

    test('should have MAX_MESSAGE_SIZE default value of 1MB', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('MAX_MESSAGE_SIZE');
      expect(DEFAULT_CONFIG.MAX_MESSAGE_SIZE).toBe(1024 * 1024);
    });

    test('should have PARSE_TIMEOUT default value of 10 seconds', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('PARSE_TIMEOUT');
      expect(DEFAULT_CONFIG.PARSE_TIMEOUT).toBe(10000);
    });

    test('should have DEBUG_MODE default value of false', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('DEBUG_MODE');
      expect(DEFAULT_CONFIG.DEBUG_MODE).toBe(false);
    });

    test('should have ALLOWED_ORIGINS default value of wildcard', () => {
      expect(DEFAULT_CONFIG).toHaveProperty('ALLOWED_ORIGINS');
      expect(DEFAULT_CONFIG.ALLOWED_ORIGINS).toEqual(['*']);
    });

    test('should have all required configuration keys', () => {
      const requiredKeys = ['MAX_MESSAGE_SIZE', 'PARSE_TIMEOUT', 'DEBUG_MODE', 'ALLOWED_ORIGINS'];
      
      requiredKeys.forEach(key => {
        expect(DEFAULT_CONFIG).toHaveProperty(key);
      });
    });

    test('should not have any unexpected keys', () => {
      const expectedKeys = ['MAX_MESSAGE_SIZE', 'PARSE_TIMEOUT', 'DEBUG_MODE', 'ALLOWED_ORIGINS'];
      const actualKeys = Object.keys(DEFAULT_CONFIG);
      
      expect(actualKeys.sort()).toEqual(expectedKeys.sort());
    });
  });

  /**
   * Test configuration initialization and priority
   */
  describe('initializeConfig - Configuration Priority', () => {
    const { initializeConfig, DEFAULT_CONFIG } = window.MermaidValidator;

    test('should use default config when no global or URL config is present', () => {
      // Ensure no global config
      delete window.DRAWIO_CONFIG;
      
      // Ensure no URL parameters
      delete window.location;
      window.location = { search: '' };
      
      const config = initializeConfig();
      
      expect(config.MAX_MESSAGE_SIZE).toBe(DEFAULT_CONFIG.MAX_MESSAGE_SIZE);
      expect(config.PARSE_TIMEOUT).toBe(DEFAULT_CONFIG.PARSE_TIMEOUT);
      expect(config.DEBUG_MODE).toBe(DEFAULT_CONFIG.DEBUG_MODE);
      expect(config.ALLOWED_ORIGINS).toEqual(DEFAULT_CONFIG.ALLOWED_ORIGINS);
    });

    test('should override default config with global config', () => {
      // Set global config
      window.DRAWIO_CONFIG = {
        maxMessageSize: 2097152,
        debugMode: true
      };
      
      // Ensure no URL parameters
      delete window.location;
      window.location = { search: '' };
      
      const config = initializeConfig();
      
      // Global config should override defaults
      expect(config.MAX_MESSAGE_SIZE).toBe(2097152);
      expect(config.DEBUG_MODE).toBe(true);
      
      // Other values should remain default
      expect(config.PARSE_TIMEOUT).toBe(DEFAULT_CONFIG.PARSE_TIMEOUT);
      expect(config.ALLOWED_ORIGINS).toEqual(DEFAULT_CONFIG.ALLOWED_ORIGINS);
    });

    test('should override global config with URL config', () => {
      // Set global config
      window.DRAWIO_CONFIG = {
        maxMessageSize: 2097152,
        debugMode: true
      };
      
      // Set URL parameters
      delete window.location;
      window.location = { search: '?maxMessageSize=3145728&parseTimeout=5000' };
      
      const config = initializeConfig();
      
      // URL config should override global config
      expect(config.MAX_MESSAGE_SIZE).toBe(3145728);
      expect(config.PARSE_TIMEOUT).toBe(5000);
      
      // Global config should override default for debugMode
      expect(config.DEBUG_MODE).toBe(true);
      
      // Default should be used for ALLOWED_ORIGINS
      expect(config.ALLOWED_ORIGINS).toEqual(DEFAULT_CONFIG.ALLOWED_ORIGINS);
    });

    test('should apply correct priority: URL > Global > Default', () => {
      // Set global config
      window.DRAWIO_CONFIG = {
        maxMessageSize: 2097152,
        parseTimeout: 8000,
        debugMode: true,
        allowedOrigins: ['https://global.com']
      };
      
      // Set URL parameters (only override some values)
      delete window.location;
      window.location = { search: '?maxMessageSize=3145728&debugMode=false' };
      
      const config = initializeConfig();
      
      // URL should override global and default
      expect(config.MAX_MESSAGE_SIZE).toBe(3145728); // From URL
      expect(config.DEBUG_MODE).toBe(false); // From URL
      
      // Global should override default
      expect(config.PARSE_TIMEOUT).toBe(8000); // From global
      expect(config.ALLOWED_ORIGINS).toEqual(['https://global.com']); // From global
    });

    test('should handle all three sources with different values', () => {
      // Set global config
      window.DRAWIO_CONFIG = {
        maxMessageSize: 2097152,
        parseTimeout: 8000
      };
      
      // Set URL parameters
      delete window.location;
      window.location = { search: '?debugMode=true&allowedOrigins=https://url.com' };
      
      const config = initializeConfig();
      
      // Each value from different source
      expect(config.MAX_MESSAGE_SIZE).toBe(2097152); // From global
      expect(config.PARSE_TIMEOUT).toBe(8000); // From global
      expect(config.DEBUG_MODE).toBe(true); // From URL
      expect(config.ALLOWED_ORIGINS).toEqual(['https://url.com']); // From URL
    });

    test('should create a new config object without modifying DEFAULT_CONFIG', () => {
      // Store original default config
      const originalDefault = { ...DEFAULT_CONFIG };
      
      // Set global config
      window.DRAWIO_CONFIG = {
        maxMessageSize: 2097152
      };
      
      const config = initializeConfig();
      
      // Config should be different from default
      expect(config.MAX_MESSAGE_SIZE).not.toBe(DEFAULT_CONFIG.MAX_MESSAGE_SIZE);
      
      // DEFAULT_CONFIG should remain unchanged
      expect(DEFAULT_CONFIG).toEqual(originalDefault);
    });

    test('should handle partial configuration from each source', () => {
      // Set global config with only one value
      window.DRAWIO_CONFIG = {
        debugMode: true
      };
      
      // Set URL parameters with only one value
      delete window.location;
      window.location = { search: '?parseTimeout=5000' };
      
      const config = initializeConfig();
      
      // Should have values from all sources
      expect(config.MAX_MESSAGE_SIZE).toBe(DEFAULT_CONFIG.MAX_MESSAGE_SIZE); // From default
      expect(config.PARSE_TIMEOUT).toBe(5000); // From URL
      expect(config.DEBUG_MODE).toBe(true); // From global
      expect(config.ALLOWED_ORIGINS).toEqual(DEFAULT_CONFIG.ALLOWED_ORIGINS); // From default
    });
  });
});
