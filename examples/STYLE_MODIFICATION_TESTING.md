# 样式修改 API 测试指南

## 概述

`examples/mermaid-integration.html` 文件现在包含了一个完整的样式修改 API 测试界面，允许您通过 JSON 指令测试 draw.io 的样式修改功能。

## 功能特性

### 1. JSON 指令输入框
- 用户可以在新增的文本框中输入 JSON 格式的样式修改指令
- 支持语法高亮和格式化显示
- 提供默认示例帮助快速上手

### 2. 智能消息路由
- 系统自动解析 JSON 中的 `action` 字段
- 根据 action 类型调用相应的 API：
  - `modifyStyle`: 调用样式修改 API
  - `generateMermaid`: 调用 Mermaid 图表生成 API
  - 其他自定义 action

### 3. 实时反馈
- 显示操作状态（处理中、成功、失败）
- 显示修改的元素数量
- 显示详细的错误信息和错误代码

### 4. 预设示例
提供 8 个常用样式修改示例：
- **改变颜色**: 修改填充色和边框色
- **加粗线条**: 使用相对操作增加线条粗细
- **添加阴影**: 添加阴影和圆角效果
- **圆角效果**: 设置圆角样式
- **修改字体**: 修改字体大小、颜色和字体族
- **相对操作**: 演示多种相对操作（increase、multiply、decrease）
- **箭头样式**: 修改连接线的箭头样式
- **组合修改**: 同时使用绝对样式和相对操作

## 使用方法

### 基本步骤

1. **打开测试页面**
   ```
   打开 examples/mermaid-integration.html 在浏览器中
   ```

2. **生成图表**
   - 在 "Mermaid 文本" 区域输入或选择示例
   - 点击 "生成图表" 按钮
   - 等待图表在 draw.io iframe 中生成

3. **选择要修改的元素**
   - 在 draw.io 编辑器中选择一个或多个图形元素

4. **应用样式修改**
   - 在 "样式修改 JSON 指令" 区域输入 JSON 指令
   - 或点击预设示例按钮加载示例
   - 点击 "应用样式修改" 按钮
   - 查看修改结果和状态反馈

### JSON 指令格式

#### 基本结构
```json
{
  "action": "modifyStyle",
  "target": "selected|edges|vertices|all",
  "styles": {
    "属性名": "属性值"
  },
  "operations": {
    "属性名": {
      "op": "set|increase|decrease|multiply",
      "value": 数值
    }
  }
}
```

#### 示例 1: 改变颜色
```json
{
  "action": "modifyStyle",
  "target": "selected",
  "styles": {
    "fillColor": "#FF6B6B",
    "strokeColor": "#4ECDC4"
  }
}
```

#### 示例 2: 相对操作
```json
{
  "action": "modifyStyle",
  "target": "selected",
  "operations": {
    "strokeWidth": { "op": "increase", "value": 2 },
    "fontSize": { "op": "multiply", "value": 1.5 }
  }
}
```

#### 示例 3: 组合修改
```json
{
  "action": "modifyStyle",
  "target": "selected",
  "styles": {
    "fillColor": "#3498DB",
    "rounded": 1,
    "shadow": 1
  },
  "operations": {
    "strokeWidth": { "op": "set", value: 3 },
    "fontSize": { "op": "increase", value: 2 }
  }
}
```

## 支持的目标选择器

- `selected`: 当前选中的元素
- `edges`: 所有连接线
- `vertices`: 所有形状节点
- `all`: 所有图形元素

## 支持的样式属性

### 颜色属性
- `fillColor`: 填充颜色
- `strokeColor`: 边框颜色
- `fontColor`: 字体颜色
- `gradientColor`: 渐变颜色
- `shadowColor`: 阴影颜色

### 数值属性
- `strokeWidth`: 线条粗细
- `fontSize`: 字体大小
- `opacity`: 透明度 (0-100)
- `arcSize`: 圆角大小 (0-100)
- `rotation`: 旋转角度 (0-360)

### 开关属性
- `rounded`: 圆角 (0 或 1)
- `dashed`: 虚线 (0 或 1)
- `shadow`: 阴影 (0 或 1)

### 箭头属性（仅边元素）
- `startArrow`: 起点箭头类型
- `endArrow`: 终点箭头类型
- `startSize`: 起点箭头大小
- `endSize`: 终点箭头大小
- `startFill`: 起点箭头填充 (0 或 1)
- `endFill`: 终点箭头填充 (0 或 1)

### 对齐属性
- `align`: 水平对齐 (left/center/right)
- `verticalAlign`: 垂直对齐 (top/middle/bottom)

## 支持的相对操作

- `set`: 设置为指定值
- `increase`: 增加指定值
- `decrease`: 减少指定值
- `multiply`: 乘以指定倍数

**注意**: 颜色属性只支持 `set` 操作

## 快捷键

- **Ctrl+Enter** (或 **Cmd+Enter** on Mac): 应用样式修改

## 错误处理

系统会显示详细的错误信息：
- `INVALID_FORMAT`: JSON 格式错误或缺少必需字段
- `INVALID_TARGET`: 无效的目标选择器
- `NO_TARGET_CELLS`: 没有找到目标元素
- `INVALID_VALUE`: 无效的属性值
- `UNSUPPORTED_OPERATION`: 不支持的操作（如对颜色使用相对操作）

## 测试场景建议

### 场景 1: 基本样式修改
1. 生成一个流程图
2. 选择一个节点
3. 使用 "改变颜色" 示例修改颜色
4. 验证颜色是否正确应用

### 场景 2: 批量修改
1. 生成一个包含多个节点的图表
2. 选择多个节点（Ctrl+点击）
3. 应用样式修改
4. 验证所有选中元素都被修改

### 场景 3: 边元素修改
1. 生成一个包含连接线的图表
2. 使用 target: "edges" 修改所有连接线
3. 验证箭头样式和线条样式

### 场景 4: 相对操作
1. 生成图表并选择元素
2. 使用 "相对操作" 示例
3. 多次应用相同的操作
4. 验证值的累积变化

### 场景 5: 错误处理
1. 输入无效的 JSON
2. 使用无效的 target 值
3. 对颜色属性使用相对操作
4. 验证错误消息是否正确显示

## 与其他 API 的集成

该测试页面同时支持：
- **Mermaid 图表生成 API**: 使用 `action: "generateMermaid"`
- **样式修改 API**: 使用 `action: "modifyStyle"`
- **其他自定义 API**: 根据 action 字段自动路由

您可以先生成图表，然后立即应用样式修改，实现完整的工作流程。

## 开发者提示

### 添加新的示例
在 `styleExamples` 对象中添加新的示例：

```javascript
const styleExamples = {
  myExample: {
    action: 'modifyStyle',
    target: 'selected',
    styles: {
      // 您的样式
    }
  }
};
```

然后在 HTML 中添加按钮：
```html
<button onclick="loadStyleExample('myExample')">我的示例</button>
```

### 监听响应消息
```javascript
window.addEventListener('message', function(evt) {
  const data = JSON.parse(evt.data);
  if (data.event === 'modifyStyle') {
    console.log('样式修改结果:', data);
  }
});
```

## 故障排除

### 问题: 点击按钮没有反应
- 确保 draw.io iframe 已完全加载
- 检查浏览器控制台是否有错误
- 确认 mermaid-import.js 插件已正确加载

### 问题: 样式没有应用
- 确保在 draw.io 中选择了元素
- 检查 JSON 格式是否正确
- 验证属性名和值是否有效

### 问题: 错误消息不清楚
- 查看浏览器控制台获取详细日志
- 参考 docs/STYLE_MODIFICATION_API.md 了解完整的 API 文档

## 相关文档

- [样式修改 API 文档](../docs/STYLE_MODIFICATION_API.md)
- [样式修改集成指南](../docs/STYLE_MODIFICATION_INTEGRATION_GUIDE.md)
- [需求文档](../.kiro/specs/style-modification/requirements.md)
- [设计文档](../.kiro/specs/style-modification/design.md)
