# Message Handler Implementation Summary

## Overview

This document summarizes the implementation of Task 9: 实现主消息处理器 (Implement Main Message Handler) for the Mermaid iframe integration feature.

## Implementation Details

### Task 9.1: handleGenerateMermaid Function

**File Created:** `src/main/webapp/js/message-handler.js`

**Purpose:** Coordinates the entire flow of receiving a Mermaid generation request, validating it, parsing the Mermaid text, inserting the diagram into the canvas, and sending a response.

**Key Features:**
1. **Message Validation**: Uses `MermaidValidator.validateMessage()` to ensure the message is valid
2. **Mermaid Parsing**: Uses `MermaidParser.parseMermaidWithTimeout()` to parse Mermaid text with timeout control
3. **Canvas Insertion**: Uses `CanvasInserter.insertDiagram()` to insert the parsed diagram into the canvas
4. **Options Support**: Applies position, scale, select, and center options
5. **Document Modification**: Marks the document as modified after successful insertion
6. **Response Handling**: Sends success or error responses back to the sender
7. **Error Handling**: Comprehensive error handling with detailed logging

**Flow:**
```
1. Validate message (format, origin, size, XSS)
   ↓
2. Parse Mermaid text (with timeout)
   ↓
3. Insert diagram into canvas
   ↓
4. Apply options (position, scale, selection)
   ↓
5. Mark document as modified
   ↓
6. Send success response
```

**Error Handling:**
- Validation errors → Send error response immediately
- Parsing errors → Send error response with parse error details
- Insertion errors → Send error response with insertion error details

### Task 9.2: handleMessage Function

**File Modified:** `src/main/webapp/plugins/mermaid-import.js`

**Purpose:** Routes incoming postMessage events to the appropriate handler based on the action type.

**Key Features:**
1. **JSON Parsing**: Handles both string and object message formats
2. **Action Routing**: Routes to different handlers based on `data.action`
3. **New Action Support**: Added routing for `generateMermaid` action
4. **Backward Compatibility**: Preserves existing `importMermaid` and `insertMermaid` handlers
5. **Graceful Degradation**: Handles missing MessageHandler module gracefully

**Routing Logic:**
```javascript
if (data.action === 'generateMermaid') {
    // Route to new MessageHandler
    window.MessageHandler.handleGenerateMermaid(ui, evt, data);
}
else if (data.action === 'importMermaid') {
    // Existing handler (preserved)
    handleMermaid(evt, data, 'importMermaid', ...);
}
else if (data.action === 'insertMermaid') {
    // Existing handler (preserved)
    handleMermaid(evt, data, 'insertMermaid', ...);
}
```

## Module Dependencies

The message handler integrates the following modules:

1. **MermaidValidator** (`mermaid-validator.js`)
   - Message validation
   - Response sending
   - Logging

2. **MermaidParser** (`mermaid-parser.js`)
   - Mermaid text parsing with timeout
   - Error extraction

3. **CanvasInserter** (`canvas-inserter.js`)
   - Diagram insertion
   - Option application (position, scale, selection)
   - State protection

## Test Coverage

### Unit Tests (`tests/messageHandler.test.js`)

**Test Cases:**
1. ✅ Should handle valid message and insert diagram
2. ✅ Should reject invalid message format
3. ✅ Should reject empty mermaid text
4. ✅ Should handle parsing errors
5. ✅ Should handle insertion errors
6. ✅ Should apply position option
7. ✅ Should apply scale option
8. ✅ Should select inserted cells by default
9. ✅ Should mark document as modified
10. ✅ Should include cellCount in success response

**Total:** 10 tests, all passing

### Integration Tests (`tests/pluginIntegration.test.js`)

**Test Cases:**
1. ✅ Should route generateMermaid action to MessageHandler
2. ✅ Should handle JSON string messages
3. ✅ Should handle object messages
4. ✅ Should ignore invalid JSON messages
5. ✅ Should ignore messages without action field
6. ✅ Should ignore null messages
7. ✅ Should pass options to handler
8. ✅ Should not interfere with other action types (backward compatibility)

**Total:** 8 tests, all passing

## Requirements Validation

### Task 9.1 Requirements
- ✅ 调用 validateMessage 验证消息 (Requirement 1.1, 5.1)
- ✅ 调用解析器解析 Mermaid (Requirement 2.1)
- ✅ 调用插入函数插入图表 (Requirement 3.1)
- ✅ 应用选项（位置、缩放、选中）(Requirement 5.4, 5.5)
- ✅ 标记文档为已修改
- ✅ 发送响应消息 (Requirement 4.1)

### Task 9.2 Requirements
- ✅ 解析 JSON 消息
- ✅ 识别 action 类型
- ✅ 路由到对应的处理器
- ✅ 保留现有的 importMermaid 和 insertMermaid 处理逻辑 (Requirement 8.1, 8.2)

## Design Properties Validated

The implementation validates the following correctness properties from the design document:

- **Property 1**: Valid message acceptance ✅
- **Property 2**: Invalid input rejection ✅
- **Property 6**: Mermaid parsing success ✅
- **Property 7**: Parse error detailed information ✅
- **Property 8**: Diagram insertion success ✅
- **Property 9**: Insertion position correctness ✅
- **Property 10**: Diagram auto-selection ✅
- **Property 13**: Success response format ✅
- **Property 14**: Error response format ✅
- **Property 16**: Scale parameter effectiveness ✅
- **Property 19**: Backward compatibility ✅

## Usage Example

### Frontend Integration

```javascript
// Send generateMermaid message to draw.io iframe
iframe.contentWindow.postMessage(JSON.stringify({
    action: 'generateMermaid',
    mermaid: 'flowchart TD\n    A --> B',
    options: {
        position: { x: 100, y: 200 },
        scale: 1.5,
        select: true,
        center: false
    }
}), '*');

// Listen for response
window.addEventListener('message', function(evt) {
    const data = JSON.parse(evt.data);
    
    if (data.event === 'generateMermaid') {
        if (data.status === 'ok') {
            console.log('Success!', data.data.cellCount, 'cells inserted');
        } else {
            console.error('Error:', data.error, data.errorCode);
        }
    }
});
```

## Files Created/Modified

### Created Files:
1. `src/main/webapp/js/message-handler.js` - Main message handler implementation
2. `tests/messageHandler.test.js` - Unit tests for message handler
3. `tests/pluginIntegration.test.js` - Integration tests for plugin routing
4. `tests/MESSAGE_HANDLER_SUMMARY.md` - This summary document

### Modified Files:
1. `src/main/webapp/plugins/mermaid-import.js` - Updated handleMessage function to route generateMermaid action

## Test Results

```
Test Suites: 8 passed, 8 total
Tests:       178 passed, 178 total
Snapshots:   0 total
Time:        7.099 s
```

All tests pass successfully, including:
- Message validation tests
- Mermaid parser tests
- Canvas inserter tests
- Log function tests
- Send response tests
- Message handler tests (new)
- Plugin integration tests (new)
- Smoke tests

## Next Steps

The following tasks remain in the implementation plan:

- [ ] Task 9.3: 编写端到端集成测试 (optional)
- [ ] Task 10: 实现配置管理
- [ ] Task 11: 检查点 - 确保所有测试通过
- [ ] Task 12: 集成到 mermaid-import.js 插件
- [ ] Task 13: 添加浏览器兼容性检查
- [ ] Task 14: 添加性能监控
- [ ] Task 15: 创建前端集成示例
- [ ] Task 16: 编写文档
- [ ] Task 17: 最终检查点

## Conclusion

Task 9 (实现主消息处理器) has been successfully completed. The implementation:

1. ✅ Integrates all previously implemented modules (validator, parser, inserter)
2. ✅ Provides a complete end-to-end flow for handling generateMermaid messages
3. ✅ Maintains backward compatibility with existing actions
4. ✅ Includes comprehensive error handling and logging
5. ✅ Has full test coverage with 18 new tests
6. ✅ Validates all requirements specified in the task details
7. ✅ Follows the design document specifications

The message handler is now ready for integration testing and can be used by frontend applications to generate Mermaid diagrams in draw.io via postMessage.
