# 需求文档：图形样式修改功能

## 简介

本功能旨在为 draw.io 添加通过 iframe postMessage 接收样式修改指令并自动应用到图形元素的能力。前端系统（如 AI 助手）可以发送 JSON 格式的样式修改指令，draw.io 内部解析该指令并调用相应的 Graph API 来完成图形的样式修改。

## 术语表

- **Frontend_System**: 宿主前端系统，负责生成样式修改指令
- **Drawio_Iframe**: 嵌入在前端系统中的 draw.io iframe 实例
- **PostMessage_Handler**: draw.io 中处理 postMessage 事件的消息处理器
- **Style_Modifier**: 样式修改器，负责解析指令并调用 Graph API
- **Graph_API**: draw.io/mxGraph 提供的图形操作 API
- **Style_Instruction**: 样式修改指令，JSON 格式的对象
- **Target_Selector**: 目标选择器，指定要修改的图形元素（selected/edges/vertices/all）
- **Style_Property**: 样式属性，如 fillColor、strokeWidth、fontSize 等
- **Relative_Operation**: 相对操作，如 increase、decrease、multiply、set

## 需求

### 需求 1：接收样式修改消息

**用户故事：** 作为前端系统开发者，我希望能够通过 postMessage 向 draw.io iframe 发送样式修改指令，以便自动修改图形样式而无需用户手动操作。

#### 验收标准

1. WHEN Frontend_System 通过 postMessage 发送包含 action: 'modifyStyle' 的消息 THEN Drawio_Iframe SHALL 接收并识别该消息
2. WHEN 消息中缺少 target 字段 THEN Drawio_Iframe SHALL 返回格式错误响应
3. WHEN 消息中既没有 styles 字段也没有 operations 字段 THEN Drawio_Iframe SHALL 返回格式错误响应
4. WHEN 消息来源不符合安全策略 THEN Drawio_Iframe SHALL 拒绝处理该消息
5. WHEN 消息格式正确 THEN Drawio_Iframe SHALL 开始处理样式修改

### 需求 2：目标选择器解析

**用户故事：** 作为 AI 助手，我希望能够指定要修改的目标元素类型，以便精确控制样式修改的范围。

#### 验收标准

1. WHEN target 为 'selected' THEN Style_Modifier SHALL 获取当前选中的所有图形元素
2. WHEN target 为 'edges' THEN Style_Modifier SHALL 获取画布上所有的边（连接线）
3. WHEN target 为 'vertices' THEN Style_Modifier SHALL 获取画布上所有的顶点（形状）
4. WHEN target 为 'all' THEN Style_Modifier SHALL 获取画布上所有的图形元素
5. WHEN target 为无效值 THEN Style_Modifier SHALL 返回无效目标错误
6. WHEN 目标选择器返回空集合 THEN Style_Modifier SHALL 返回无目标元素警告

### 需求 3：绝对样式值设置

**用户故事：** 作为 AI 助手，我希望能够设置图形的绝对样式值，以便直接指定颜色、线条粗细等属性。

#### 验收标准

1. WHEN styles 对象包含 fillColor 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置填充颜色
2. WHEN styles 对象包含 strokeColor 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置边框颜色
3. WHEN styles 对象包含 strokeWidth 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置线条粗细
4. WHEN styles 对象包含 fontSize 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置字体大小
5. WHEN styles 对象包含 fontStyle 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置字体样式
6. WHEN styles 对象包含 dashed 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置虚线样式
7. WHEN styles 对象包含 rounded 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置圆角样式
8. WHEN styles 对象包含 shadow 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置阴影效果
9. WHEN styles 对象包含 opacity 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置透明度
10. WHEN styles 对象包含无效属性名 THEN Style_Modifier SHALL 忽略该属性并继续处理其他属性

### 需求 4：相对样式操作

**用户故事：** 作为 AI 助手，我希望能够使用相对操作修改样式值，以便在不知道当前值的情况下进行增减调整。

#### 验收标准

1. WHEN operations 对象包含 op: 'set' 的操作 THEN Style_Modifier SHALL 设置属性为指定的绝对值
2. WHEN operations 对象包含 op: 'increase' 的操作 THEN Style_Modifier SHALL 在当前值基础上增加指定值
3. WHEN operations 对象包含 op: 'decrease' 的操作 THEN Style_Modifier SHALL 在当前值基础上减少指定值
4. WHEN operations 对象包含 op: 'multiply' 的操作 THEN Style_Modifier SHALL 将当前值乘以指定倍数
5. WHEN 相对操作应用于颜色属性 THEN Style_Modifier SHALL 返回不支持的操作错误
6. WHEN 相对操作的结果超出有效范围 THEN Style_Modifier SHALL 将值限制在有效范围内

### 需求 5：箭头样式设置

**用户故事：** 作为 AI 助手，我希望能够修改连接线的箭头样式，以便控制箭头的类型、大小和填充。

#### 验收标准

1. WHEN styles 对象包含 startArrow 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置起点箭头类型
2. WHEN styles 对象包含 endArrow 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置终点箭头类型
3. WHEN styles 对象包含 startSize 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置起点箭头大小
4. WHEN styles 对象包含 endSize 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置终点箭头大小
5. WHEN styles 对象包含 startFill 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置起点箭头填充
6. WHEN styles 对象包含 endFill 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置终点箭头填充
7. WHEN 箭头样式应用于非边元素 THEN Style_Modifier SHALL 忽略该属性

### 需求 6：字体和对齐样式设置

**用户故事：** 作为 AI 助手，我希望能够修改文字的字体和对齐方式，以便控制文字的显示效果。

#### 验收标准

1. WHEN styles 对象包含 fontFamily 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置字体
2. WHEN styles 对象包含 fontColor 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置字体颜色
3. WHEN styles 对象包含 align 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置水平对齐
4. WHEN styles 对象包含 verticalAlign 属性 THEN Style_Modifier SHALL 调用 Graph_API 设置垂直对齐
5. WHEN align 值不是 left/center/right THEN Style_Modifier SHALL 返回无效值错误
6. WHEN verticalAlign 值不是 top/middle/bottom THEN Style_Modifier SHALL 返回无效值错误

### 需求 7：返回处理结果

**用户故事：** 作为前端系统开发者，我希望能够接收到 draw.io 的处理结果反馈，以便向用户显示操作状态或错误信息。

#### 验收标准

1. WHEN 样式修改成功 THEN Drawio_Iframe SHALL 通过 postMessage 发送包含 event: 'modifyStyle' 和 status: 'ok' 的响应消息
2. WHEN 样式修改失败 THEN Drawio_Iframe SHALL 通过 postMessage 发送包含 event: 'modifyStyle'、status: 'error' 和 error 字段的响应消息
3. WHEN 响应消息包含成功信息 THEN data 字段 SHALL 包含修改的元素数量
4. WHEN 响应消息包含错误信息 THEN error 字段 SHALL 包含可读的错误描述和错误代码
5. WHEN 部分元素修改成功部分失败 THEN 响应 SHALL 包含成功和失败的数量

### 需求 8：批量操作支持

**用户故事：** 作为 AI 助手，我希望能够在一次消息中同时设置多个样式属性，以便提高操作效率。

#### 验收标准

1. WHEN styles 对象包含多个属性 THEN Style_Modifier SHALL 在一次操作中应用所有属性
2. WHEN operations 对象包含多个操作 THEN Style_Modifier SHALL 按顺序执行所有操作
3. WHEN 同时提供 styles 和 operations THEN Style_Modifier SHALL 先应用 styles 再应用 operations
4. WHEN 批量操作中某个属性失败 THEN Style_Modifier SHALL 继续处理其他属性并在响应中报告失败

### 需求 9：撤销支持

**用户故事：** 作为 draw.io 用户，我希望样式修改操作能够被撤销，以便在修改不满意时恢复原状。

#### 验收标准

1. WHEN 样式修改成功 THEN Style_Modifier SHALL 将操作记录到撤销历史
2. WHEN 用户执行撤销操作 THEN 图形样式 SHALL 恢复到修改前的状态
3. WHEN 批量修改多个属性 THEN 撤销操作 SHALL 一次性恢复所有属性

### 需求 10：向后兼容性

**用户故事：** 作为 draw.io 维护者，我希望新功能不影响现有的 postMessage 处理逻辑，以便保持与现有集成的兼容性。

#### 验收标准

1. WHEN 添加新的 modifyStyle action 处理器 THEN PostMessage_Handler SHALL 保持现有 action 的处理逻辑不变
2. WHEN 现有代码调用 postMessage 处理器 THEN 现有功能 SHALL 继续正常工作
3. WHEN 新功能初始化失败 THEN Drawio_Iframe SHALL 降级到不支持该功能但不影响其他功能

