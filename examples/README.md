# Draw.io Mermaid 集成示例

本目录包含了使用 Draw.io Mermaid iframe 集成功能的示例代码。

## 文件说明

### 1. mermaid-integration.html

纯 HTML/JavaScript 实现的集成示例，无需任何构建工具或框架。

**特性：**
- 完整的用户界面，包含输入框、按钮和状态显示
- 内置多个 Mermaid 示例模板（流程图、时序图、类图等）
- 实时状态反馈
- 支持 Ctrl+Enter 快捷键生成图表

**使用方法：**
1. 直接在浏览器中打开 `mermaid-integration.html` 文件
2. 在文本框中输入或选择 Mermaid 语法
3. 点击"生成图表"按钮或按 Ctrl+Enter
4. 图表将自动插入到 Draw.io 画布中

### 2. DrawioMermaidIntegration.jsx

React 组件实现的集成示例，适合集成到 React 应用中。

**特性：**
- 使用 React Hooks (useRef, useEffect, useState)
- 完整的状态管理
- 内联样式，无需额外 CSS 文件
- 支持键盘快捷键

**使用方法：**

```jsx
import DrawioMermaidIntegration from './examples/DrawioMermaidIntegration';

function App() {
  return (
    <div className="App">
      <DrawioMermaidIntegration />
    </div>
  );
}
```

**依赖：**
- React 16.8+ (需要 Hooks 支持)

## 消息格式

### 发送到 Draw.io 的消息

```javascript
{
  action: 'generateMermaid',
  mermaid: 'flowchart TD\n    A --> B',
  options: {
    position: { x: 50, y: 50 },  // 可选：插入位置
    select: true,                 // 可选：是否选中
    scale: 1.0,                   // 可选：缩放比例
    center: false                 // 可选：是否居中
  }
}
```

### 从 Draw.io 接收的响应

**成功响应：**
```javascript
{
  event: 'generateMermaid',
  status: 'ok',
  data: {
    cellCount: 5  // 插入的图形数量
  }
}
```

**错误响应：**
```javascript
{
  event: 'generateMermaid',
  status: 'error',
  error: 'Invalid Mermaid syntax at line 2',
  errorCode: 'PARSE_ERROR'
}
```

## 错误代码

| 错误代码 | 描述 |
|---------|------|
| `INVALID_FORMAT` | 消息格式无效 |
| `EMPTY_MERMAID` | Mermaid 文本为空 |
| `PARSE_ERROR` | Mermaid 解析失败 |
| `UNSUPPORTED_TYPE` | 不支持的图表类型 |
| `TIMEOUT` | 解析超时 |
| `INSERT_FAILED` | 插入失败 |
| `ORIGIN_DENIED` | 来源被拒绝 |
| `SIZE_EXCEEDED` | 消息过大 |
| `XSS_DETECTED` | 检测到 XSS 攻击 |

## 支持的 Mermaid 图表类型

- 流程图 (flowchart)
- 时序图 (sequenceDiagram)
- 类图 (classDiagram)
- 状态图 (stateDiagram)
- ER 图 (erDiagram)
- 甘特图 (gantt)
- 饼图 (pie)
- Git 图 (gitGraph)
- 用户旅程图 (journey)

## 配置选项

可以通过 URL 参数配置 Draw.io iframe：

```html
<iframe 
  src="https://app.diagrams.net/?embed=1&proto=json&spin=1&allowedOrigins=https://example.com&debugMode=true"
  ...>
</iframe>
```

**可用参数：**
- `embed=1` - 启用嵌入模式
- `proto=json` - 使用 JSON 协议
- `spin=1` - 显示加载动画
- `allowedOrigins` - 允许的消息来源（逗号分隔）
- `debugMode` - 启用调试模式

## 故障排查

### 问题：消息未被接收

**解决方案：**
1. 确保 iframe 已完全加载
2. 检查浏览器控制台是否有错误
3. 验证消息格式是否正确
4. 确认 origin 配置

### 问题：解析失败

**解决方案：**
1. 验证 Mermaid 语法是否正确
2. 检查是否使用了不支持的图表类型
3. 查看错误消息中的详细信息

### 问题：图表未显示

**解决方案：**
1. 检查插入是否成功（查看响应消息）
2. 尝试调整视图位置
3. 检查画布是否有足够空间

## 安全注意事项

1. **Origin 验证**：生产环境中应配置具体的 `allowedOrigins`，不要使用 `*`
2. **内容清理**：避免在 Mermaid 文本中包含敏感信息
3. **消息大小**：单个消息不应超过 1MB
4. **XSS 防护**：系统会自动检测和拒绝包含恶意脚本的消息

## 更多资源

- [Draw.io 官方文档](https://www.diagrams.net/doc/)
- [Mermaid 官方文档](https://mermaid.js.org/)
- [项目设计文档](../.kiro/specs/mermaid-iframe-integration/design.md)
- [项目需求文档](../.kiro/specs/mermaid-iframe-integration/requirements.md)

## 许可证

本示例代码遵循项目主许可证。
