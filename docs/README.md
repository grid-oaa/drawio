# Mermaid iframe 集成文档

欢迎使用 draw.io 的 Mermaid iframe 集成功能文档。

## 文档导航

### 📘 [API 文档](./MERMAID_IFRAME_API.md)
完整的 API 规范，包括：
- 消息格式定义
- 响应格式说明
- 错误代码参考
- 配置选项详解
- 浏览器兼容性信息

**适合**：需要了解详细 API 规范的开发者

### 🚀 [集成指南](./MERMAID_IFRAME_INTEGRATION_GUIDE.md)
从零开始的集成教程，包括：
- 快速开始指南
- 完整代码示例（HTML、React、Vue.js）
- 高级用法
- 与后端 API 集成
- 安全最佳实践
- 性能优化建议

**适合**：正在集成此功能的开发者

### 🔧 [故障排查指南](./MERMAID_IFRAME_TROUBLESHOOTING.md)
问题诊断和解决方案，包括：
- 快速诊断流程
- 常见问题及解决方案
- 调试技巧
- 检查清单
- FAQ

**适合**：遇到问题需要排查的开发者

## 快速链接

- **开始使用**：查看 [集成指南 - 快速开始](./MERMAID_IFRAME_INTEGRATION_GUIDE.md#快速开始)
- **API 参考**：查看 [API 文档 - 消息格式](./MERMAID_IFRAME_API.md#消息格式)
- **遇到问题**：查看 [故障排查指南](./MERMAID_IFRAME_TROUBLESHOOTING.md)
- **代码示例**：查看 [集成指南 - 完整示例](./MERMAID_IFRAME_INTEGRATION_GUIDE.md#完整示例)

## 功能概述

Mermaid iframe 集成功能允许外部前端系统通过浏览器的 `postMessage` API 向嵌入的 draw.io iframe 发送 Mermaid 文本，draw.io 将自动解析并将生成的图表插入到画布中。

### 主要特性

- ✅ 简单易用的 postMessage API
- ✅ 支持多种 Mermaid 图表类型
- ✅ 自动解析和插入
- ✅ 详细的错误信息
- ✅ 安全的 origin 验证
- ✅ 可配置的选项（位置、缩放等）
- ✅ 完善的错误处理
- ✅ 调试模式支持

### 工作流程

```
用户输入 → 后端 API → Mermaid 文本 → postMessage → draw.io → 图表生成
```

## 支持的 Mermaid 图表类型

- Flowchart（流程图）
- Sequence Diagram（时序图）
- Class Diagram（类图）
- State Diagram（状态图）
- Entity Relationship Diagram（实体关系图）
- User Journey（用户旅程图）
- Gantt（甘特图）
- Pie Chart（饼图）
- Git Graph（Git 图）

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 快速示例

```javascript
// 1. 嵌入 iframe
<iframe 
    id="drawio-iframe"
    src="https://app.diagrams.net/?embed=1&proto=json"
    width="100%" 
    height="600">
</iframe>

// 2. 发送消息
const iframe = document.getElementById('drawio-iframe');
iframe.contentWindow.postMessage(JSON.stringify({
    action: 'generateMermaid',
    mermaid: 'flowchart TD\n    A[开始] --> B[结束]'
}), '*');

// 3. 监听响应
window.addEventListener('message', function(evt) {
    const data = JSON.parse(evt.data);
    if (data.event === 'generateMermaid') {
        console.log('状态:', data.status);
    }
});
```

## 获取帮助

- 📖 查看文档：从上方选择相应的文档
- 🐛 报告问题：提供详细的错误信息和重现步骤
- 💡 功能建议：欢迎提出改进建议

## 相关资源

- [Mermaid 官方文档](https://mermaid.js.org/)
- [draw.io 官方网站](https://www.diagrams.net/)
- [Mermaid Live Editor](https://mermaid.live/)（用于验证语法）

## 版本信息

- **当前版本**：1.0.0
- **最后更新**：2024-12
- **兼容性**：draw.io 22.0.0+

---

**提示**：如果您是第一次使用，建议从 [集成指南](./MERMAID_IFRAME_INTEGRATION_GUIDE.md) 开始。
