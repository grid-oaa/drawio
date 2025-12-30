# 实现计划：图形样式修改功能

## 概述

本实现计划将图形样式修改功能分解为一系列增量式的编码任务。每个任务都建立在前一个任务的基础上，最终实现完整的功能。所有任务都涉及编写、修改或测试代码。

## 任务

- [x] 1. 实现样式验证器
  - [x] 1.1 实现 validateStyleMessage 函数
    - 验证 target 字段存在且有效
    - 验证 styles 或 operations 至少存在一个
    - 返回验证结果对象
    - _需求：1.1, 1.2, 1.3, 1.5_

  - [ ]* 1.2 编写消息验证的属性测试
    - **属性 1：有效消息接受**
    - **属性 2：无效消息拒绝**
    - **验证：需求 1.1, 1.2, 1.3, 1.5**

  - [x] 1.3 实现 target 值验证
    - 验证 target 是 selected/edges/vertices/all 之一
    - 返回 INVALID_TARGET 错误
    - _需求：2.5_

  - [ ]* 1.4 编写目标验证的属性测试
    - **属性 4：无效目标拒绝**
    - **验证：需求 2.5**

- [x] 2. 实现目标选择器
  - [x] 2.1 实现 getTargetCells 函数
    - 根据 target 值调用相应的 Graph API
    - selected: graph.getSelectionCells()
    - edges: graph.getChildEdges()
    - vertices: graph.getChildVertices()
    - all: graph.getChildCells()
    - _需求：2.1, 2.2, 2.3, 2.4_

  - [ ]* 2.2 编写目标选择器的属性测试
    - **属性 3：目标选择器正确性**
    - **验证：需求 2.1, 2.2, 2.3, 2.4**

  - [x] 2.3 实现空选择处理
    - 检查返回的 cells 数组是否为空
    - 返回 NO_TARGET_CELLS 错误
    - _需求：2.6_

- [x] 3. 实现属性分类和约束
  - [x] 3.1 定义属性分类常量
    - COLOR_PROPERTIES: 颜色属性列表
    - NUMERIC_PROPERTIES: 数值属性列表
    - BOOLEAN_PROPERTIES: 开关属性列表
    - ENUM_PROPERTIES: 枚举属性及其有效值
    - EDGE_ONLY_PROPERTIES: 边专用属性列表
    - _需求：3.1-3.9, 5.1-5.6, 6.1-6.4_

  - [x] 3.2 定义值约束常量
    - VALUE_CONSTRAINTS: 各属性的最小/最大值
    - 实现 clampValue 函数
    - _需求：4.6_

  - [ ]* 3.3 编写值范围限制的属性测试
    - **属性 8：值范围限制**
    - **验证：需求 4.6**

- [x] 4. 检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户

- [-] 5. 实现绝对样式应用
  - [x] 5.1 实现 applyAbsoluteStyles 函数
    - 遍历 styles 对象的所有属性
    - 调用 graph.setCellStyles 设置样式
    - 过滤边专用属性（只应用于边元素）
    - _需求：3.1-3.9, 5.1-5.6, 6.1-6.4_

  - [ ] 5.2 编写样式应用的属性测试

    - **属性 5：样式属性正确应用**
    - **验证：需求 3.1-3.9**

  - [x] 5.3 实现边专用属性过滤
    - 实现 filterCellsForProperty 函数
    - 箭头属性只应用于边元素
    - _需求：5.7_

  - [ ]* 5.4 编写边专用属性的属性测试
    - **属性 9：箭头属性边专用**
    - **验证：需求 5.7**

  - [x] 5.5 实现枚举值验证
    - 验证 align 值是 left/center/right
    - 验证 verticalAlign 值是 top/middle/bottom
    - 返回 INVALID_VALUE 错误
    - _需求：6.5, 6.6_

  - [ ]* 5.6 编写枚举值验证的属性测试
    - **属性 10：对齐值验证**
    - **验证：需求 6.5, 6.6**

- [-] 6. 实现相对操作
  - [x] 6.1 实现 applyRelativeOperations 函数
    - 遍历 operations 对象的所有属性
    - 调用 applyOperationToCells 执行操作
    - _需求：4.1, 4.2, 4.3, 4.4_

  - [x] 6.2 实现 applyOperationToCells 函数
    - 获取当前属性值
    - 根据操作类型计算新值
    - set: 直接设置
    - increase: 当前值 + 指定值
    - decrease: 当前值 - 指定值
    - multiply: 当前值 * 指定倍数
    - 应用值范围限制
    - _需求：4.1, 4.2, 4.3, 4.4, 4.6_

  - [ ]* 6.3 编写相对操作的属性测试
    - **属性 6：相对操作正确计算**
    - **验证：需求 4.1, 4.2, 4.3, 4.4**

  - [x] 6.4 实现颜色属性操作限制
    - 检查属性是否为颜色属性
    - 颜色属性只支持 set 操作
    - 返回 UNSUPPORTED_OPERATION 错误
    - _需求：4.5_

  - [ ]* 6.5 编写颜色属性限制的属性测试
    - **属性 7：颜色属性操作限制**
    - **验证：需求 4.5**

- [x] 7. 实现批量操作和撤销支持
  - [x] 7.1 实现 applyStyleModifications 函数
    - 使用 model.beginUpdate/endUpdate 包装操作
    - 先应用 styles，再应用 operations
    - 返回修改结果
    - _需求：8.1, 8.2, 8.3, 9.1_

  - [ ]* 7.2 编写批量操作的属性测试
    - **属性 13：批量样式原子性**
    - **属性 14：样式和操作顺序**
    - **验证：需求 8.1, 8.3, 9.3**

  - [ ]* 7.3 编写撤销功能的属性测试
    - **属性 15：撤销功能**
    - **验证：需求 9.1, 9.2**

- [x] 8. 检查点 - 确保所有测试通过
  - 确保所有测试通过，如有问题请询问用户

- [x] 9. 实现响应发送器
  - [x] 9.1 实现 sendStyleResponse 函数
    - 构造响应消息对象
    - 成功时包含 modifiedCount
    - 失败时包含 error 和 errorCode
    - 使用 evt.source.postMessage 发送
    - _需求：7.1, 7.2, 7.3, 7.4_

  - [ ]* 9.2 编写响应格式的属性测试
    - **属性 11：成功响应格式**
    - **属性 12：错误响应格式**
    - **验证：需求 7.1, 7.2, 7.3, 7.4**

- [x] 10. 实现主处理函数
  - [x] 10.1 实现 handleModifyStyle 函数
    - 调用 validateStyleMessage 验证消息
    - 调用 getTargetCells 获取目标元素
    - 调用 applyStyleModifications 应用修改
    - 标记文档为已修改
    - 发送响应消息
    - _需求：1.1, 1.5, 7.1, 7.2_

  - [x] 10.2 更新 handleMessage 函数
    - 添加 modifyStyle action 路由
    - 保持现有 action 处理逻辑不变
    - _需求：10.1, 10.2_

  - [ ]* 10.3 编写向后兼容性的属性测试
    - **属性 16：向后兼容性**
    - **验证：需求 10.1, 10.2**

- [x] 11. 集成到 mermaid-import.js 插件
  - [x] 11.1 添加样式修改相关常量
    - STYLE_ERROR_CODES
    - VALID_TARGETS
    - VALID_OPERATIONS
    - COLOR_PROPERTIES
    - NUMERIC_PROPERTIES
    - BOOLEAN_PROPERTIES
    - ENUM_PROPERTIES
    - EDGE_ONLY_PROPERTIES
    - VALUE_CONSTRAINTS
    - _需求：3.1-3.9, 4.1-4.6, 5.1-5.7, 6.1-6.6_

  - [x] 11.2 添加样式修改函数
    - validateStyleMessage
    - getTargetCells
    - filterCellsForProperty
    - clampValue
    - applyAbsoluteStyles
    - applyOperationToCells
    - applyRelativeOperations
    - applyStyleModifications
    - sendStyleResponse
    - handleModifyStyle
    - _需求：1.1-1.5, 2.1-2.6, 3.1-3.10, 4.1-4.6_

  - [x] 11.3 更新消息路由
    - 在 handleMessage 中添加 modifyStyle 路由
    - _需求：10.1, 10.2_

- [x] 12. 检查点 - 确保所有测试通过
  - 运行完整的测试套件
  - 验证所有功能正常工作
  - 确保所有测试通过，如有问题请询问用户

- [x] 13. 编写集成测试
  - [ ]* 13.1 编写端到端集成测试
    - 测试完整的消息处理流程
    - 测试成功和失败场景
    - 测试与现有功能的兼容性
    - _需求：7.5, 10.2_

  - [ ]* 13.2 编写样式修改示例测试
    - 测试颜色修改
    - 测试线条加粗
    - 测试虚线设置
    - 测试字体修改
    - 测试阴影添加
    - 测试组合修改
    - _需求：3.1-3.9_

- [x] 14. 更新文档
  - [x] 14.1 更新 API 文档
    - 文档化 modifyStyle 消息格式
    - 文档化响应格式
    - 文档化错误代码
    - _需求：7.1-7.4_

  - [x] 14.2 更新集成指南
    - 添加样式修改使用示例
    - 添加 AI 集成示例
    - _需求：1.1, 7.1_

- [x] 15. 最终检查点 - 确保所有测试通过
  - 运行完整的测试套件
  - 验证所有功能正常工作
  - 检查代码覆盖率
  - 确保所有测试通过，如有问题请询问用户

- [x] 16. 前端集成测试示例
  - 在examples/mermaid-integration.html中再添加一个新的输入框，注意：html中原有的内容不做修改
  - 用户在新的输入框输入json格式内容，然后传递给由iframe引入的drawio
  - drawio解析json内容，然后根据json内容判断调用哪个api来修改图表

## 注意事项

- 标记为 `*` 的任务是可选的测试任务，可以根据需要跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号，便于追溯
- 检查点任务用于确保增量进展和及时发现问题
- 所有代码修改都应该保持向后兼容性
- 测试应该使用 Jest 和 fast-check 框架
- 每个属性测试至少运行 100 次迭代
- 使用 model.beginUpdate/endUpdate 确保批量操作的原子性
