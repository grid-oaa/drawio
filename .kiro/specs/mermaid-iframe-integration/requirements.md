# 需求文档：Mermaid iframe 集成

## 简介

本功能旨在为 draw.io 添加通过 iframe postMessage 接收 Mermaid 文本并自动生成图表的能力。前端系统收集用户的自然语言描述，后端将其转换为 Mermaid 语法文本，然后通过 postMessage 发送给嵌入的 draw.io iframe，draw.io 内部解析 Mermaid 并将生成的图表插入到画布中。

## 术语表

- **Frontend_System**: 宿主前端系统，负责收集用户自然语言输入并调用后端 API
- **Backend_API**: 后端服务，负责将自然语言转换为 Mermaid 语法文本
- **Drawio_Iframe**: 嵌入在前端系统中的 draw.io iframe 实例
- **PostMessage_Handler**: draw.io 中处理 postMessage 事件的消息处理器
- **Mermaid_Parser**: draw.io 内置的 Mermaid 解析器（parseMermaidDiagram 或 generateMermaidImage）
- **Canvas**: draw.io 的绘图画布
- **Mermaid_Text**: 符合 Mermaid 语法的文本字符串（如 "flowchart TD ..."）
- **XML_Data**: draw.io 内部使用的图表 XML 格式数据

## 需求

### 需求 1：接收 Mermaid 生成消息

**用户故事：** 作为前端系统开发者，我希望能够通过 postMessage 向 draw.io iframe 发送 Mermaid 文本，以便自动生成图表而无需用户手动操作。

#### 验收标准

1. WHEN Frontend_System 通过 postMessage 发送包含 action: 'generateMermaid' 和 mermaid 字段的消息 THEN Drawio_Iframe SHALL 接收并识别该消息
2. WHEN 消息中的 mermaid 字段为空或未定义 THEN Drawio_Iframe SHALL 返回错误响应并拒绝处理
3. WHEN 消息来源不符合安全策略（如跨域限制）THEN Drawio_Iframe SHALL 拒绝处理该消息
4. WHEN 消息格式不符合预期（缺少必需字段）THEN Drawio_Iframe SHALL 返回格式错误响应

### 需求 2：解析 Mermaid 文本

**用户故事：** 作为 draw.io 系统，我希望能够解析接收到的 Mermaid 文本，以便将其转换为可在画布上显示的图表格式。

#### 验收标准

1. WHEN Drawio_Iframe 接收到有效的 Mermaid_Text THEN Mermaid_Parser SHALL 将其解析为 XML_Data
2. WHEN Mermaid_Text 包含语法错误 THEN Mermaid_Parser SHALL 返回详细的错误信息
3. WHEN Mermaid_Text 包含不支持的 Mermaid 图表类型 THEN Mermaid_Parser SHALL 返回不支持类型的错误信息
4. WHEN 解析成功 THEN Mermaid_Parser SHALL 生成符合 draw.io 规范的 XML_Data
5. WHEN 解析过程超时（超过 10 秒）THEN Mermaid_Parser SHALL 终止解析并返回超时错误

### 需求 3：插入图表到画布

**用户故事：** 作为 draw.io 用户，我希望生成的图表能够自动插入到当前画布中，以便我可以立即查看和编辑生成的图表。

#### 验收标准

1. WHEN Mermaid_Parser 成功生成 XML_Data THEN Drawio_Iframe SHALL 将图表插入到 Canvas 的当前页面
2. WHEN Canvas 已有内容 THEN Drawio_Iframe SHALL 将新图表插入到空白区域或画布中心
3. WHEN 插入成功 THEN Drawio_Iframe SHALL 自动选中新插入的图表
4. WHEN 插入成功 THEN Drawio_Iframe SHALL 调整视图以确保新图表可见
5. WHEN 插入失败 THEN Drawio_Iframe SHALL 保持画布原有状态不变

### 需求 4：返回处理结果

**用户故事：** 作为前端系统开发者，我希望能够接收到 draw.io 的处理结果反馈，以便向用户显示操作状态或错误信息。

#### 验收标准

1. WHEN 图表生成成功 THEN Drawio_Iframe SHALL 通过 postMessage 发送包含 event: 'generateMermaid' 和 status: 'ok' 的响应消息
2. WHEN 图表生成失败 THEN Drawio_Iframe SHALL 通过 postMessage 发送包含 event: 'generateMermaid'、status: 'error' 和 error 字段的响应消息
3. WHEN 发送响应消息 THEN Drawio_Iframe SHALL 确保消息发送到正确的源（消息发送者）
4. WHEN 响应消息包含错误信息 THEN error 字段 SHALL 包含可读的错误描述和错误代码
5. WHEN 响应消息发送成功 THEN Frontend_System SHALL 能够在 message 事件监听器中接收到该响应

### 需求 5：消息格式规范

**用户故事：** 作为系统集成者，我希望有明确的消息格式规范，以便确保前端系统和 draw.io iframe 之间的通信一致性。

#### 验收标准

1. THE PostMessage_Handler SHALL 接受包含以下字段的 JSON 格式消息：{ action: 'generateMermaid', mermaid: string }
2. THE PostMessage_Handler SHALL 支持可选的 options 字段用于传递额外配置（如插入位置、缩放比例等）
3. THE PostMessage_Handler SHALL 返回包含以下字段的响应消息：{ event: 'generateMermaid', status: 'ok' | 'error', error?: string, errorCode?: string }
4. WHEN options 字段包含 position 参数 THEN Drawio_Iframe SHALL 在指定位置插入图表
5. WHEN options 字段包含 scale 参数 THEN Drawio_Iframe SHALL 按指定比例缩放图表

### 需求 6：安全性与验证

**用户故事：** 作为系统管理员，我希望 draw.io iframe 能够验证消息来源，以便防止恶意脚本注入或未授权的操作。

#### 验收标准

1. WHEN 接收到 postMessage THEN PostMessage_Handler SHALL 验证消息来源的 origin
2. WHERE 配置了允许的 origin 列表 THEN PostMessage_Handler SHALL 仅处理来自允许列表中的消息
3. WHEN 消息来源不在允许列表中 THEN PostMessage_Handler SHALL 拒绝处理并记录安全警告
4. WHEN 消息内容包含潜在的 XSS 攻击向量 THEN PostMessage_Handler SHALL 进行内容清理或拒绝处理
5. THE PostMessage_Handler SHALL 限制消息大小不超过 1MB 以防止 DoS 攻击

### 需求 7：错误处理与日志

**用户故事：** 作为开发者，我希望系统能够提供详细的错误信息和日志，以便快速定位和解决集成问题。

#### 验收标准

1. WHEN 任何处理步骤发生错误 THEN Drawio_Iframe SHALL 记录详细的错误日志到控制台
2. WHEN 错误发生 THEN 错误日志 SHALL 包含错误类型、错误消息、堆栈跟踪和相关上下文信息
3. WHEN 处理成功 THEN Drawio_Iframe SHALL 记录成功日志（在调试模式下）
4. THE PostMessage_Handler SHALL 提供调试模式开关用于启用详细日志输出
5. WHEN 发生解析错误 THEN 错误消息 SHALL 包含 Mermaid 文本中的错误位置信息

### 需求 8：向后兼容性

**用户故事：** 作为 draw.io 维护者，我希望新功能不影响现有的 postMessage 处理逻辑，以便保持与现有集成的兼容性。

#### 验收标准

1. WHEN 添加新的 action 处理器 THEN PostMessage_Handler SHALL 保持现有 action 的处理逻辑不变
2. WHEN 现有代码调用 postMessage 处理器 THEN 现有功能 SHALL 继续正常工作
3. WHEN 新功能初始化失败 THEN Drawio_Iframe SHALL 降级到不支持该功能但不影响其他功能
4. THE PostMessage_Handler SHALL 在不支持的浏览器中优雅降级并返回不支持错误
