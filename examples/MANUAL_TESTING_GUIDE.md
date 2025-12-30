# 前端集成示例手动测试指南

本指南提供了快速测试前端集成示例的步骤。

## 快速开始

### 测试 HTML 示例（5 分钟）

1. **打开文件**
   ```
   在浏览器中打开: examples/mermaid-integration.html
   ```

2. **验证基本功能**
   - 等待页面加载，应该看到蓝色提示 "Draw.io 已就绪"
   - 点击 "生成图表" 按钮
   - 等待 2-3 秒，应该看到绿色提示 "图表生成成功"
   - 在 Draw.io 画布中应该看到流程图

3. **测试示例模板**
   - 点击 "时序图" 按钮
   - 点击 "生成图表"
   - 验证时序图出现在画布中

4. **测试错误处理**
   - 点击 "清空输入" 按钮
   - 点击 "生成图表"
   - 应该看到红色警告 "请输入 Mermaid 文本"

### 测试 React 组件（需要 React 环境）

1. **创建测试应用**
   ```bash
   npx create-react-app test-app
   cd test-app
   ```

2. **复制组件**
   ```bash
   cp ../examples/DrawioMermaidIntegration.jsx src/
   ```

3. **修改 App.js**
   ```javascript
   import DrawioMermaidIntegration from './DrawioMermaidIntegration';
   
   function App() {
     return <DrawioMermaidIntegration />;
   }
   
   export default App;
   ```

4. **运行应用**
   ```bash
   npm start
   ```

5. **测试功能**
   - 验证组件渲染正常
   - 测试生成图表功能
   - 测试示例模板

## 预期结果

### ✅ 成功标志

- 页面加载无错误
- Draw.io iframe 正常显示
- 点击生成后图表出现在画布中
- 状态消息准确反映操作结果
- 所有示例模板都能正常工作

### ❌ 失败标志

- 控制台有错误消息
- iframe 无法加载
- 点击生成后无反应
- 图表未出现在画布中
- 状态消息不更新

## 常见问题

### 问题: iframe 显示 "无法连接"

**原因**: 网络连接问题或 Draw.io 服务不可用

**解决方案**: 
- 检查网络连接
- 稍后重试
- 尝试使用 VPN（如果在某些地区）

### 问题: 点击生成后无反应

**原因**: iframe 可能未完全加载

**解决方案**:
- 等待 5-10 秒让 iframe 完全加载
- 刷新页面重试
- 检查浏览器控制台是否有错误

### 问题: 图表生成失败

**原因**: Mermaid 语法错误

**解决方案**:
- 使用示例模板测试
- 检查 Mermaid 语法是否正确
- 查看错误消息了解具体问题

## 详细测试

如需进行完整的测试，请参考：
- `TESTING_CHECKLIST.md` - 完整的测试清单
- `TEST_EXECUTION_REPORT.md` - 测试执行报告模板

## 报告问题

如果发现问题，请记录：
1. 问题描述
2. 复现步骤
3. 预期行为
4. 实际行为
5. 浏览器和操作系统信息
6. 控制台错误消息（如果有）

## 测试完成

完成测试后，请在 `TEST_EXECUTION_REPORT.md` 中记录结果。
