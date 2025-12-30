# Easy Draw 前端对接指南

本文档说明如何将 Vue 2 前端系统与 Draw.io Mermaid 图表生成功能进行对接。

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                    Easy Draw 前端                            │
├─────────────────────┬───────────────────────────────────────┤
│   Draw.io iframe    │         AI 对话面板                    │
│   (左侧绘图区)       │         (右侧输入区)                   │
│                     │                                       │
│   ┌─────────────┐   │   ┌─────────────────────────────┐    │
│   │             │   │   │  1. 用户输入业务描述         │    │
│   │   画布区域   │◄──┼───│  2. 调用后端生成 Mermaid    │    │
│   │             │   │   │  3. postMessage 发送到 iframe│    │
│   └─────────────┘   │   └─────────────────────────────┘    │
└─────────────────────┴───────────────────────────────────────┘
```

## 快速开始

### 1. 创建 Draw.io 组件

创建 `src/components/DrawioEditor.vue`：

```vue
<template>
  <div class="drawio-container">
    <iframe
      ref="drawioIframe"
      :src="iframeSrc"
      class="drawio-iframe"
      @load="onIframeLoad"
    ></iframe>
  </div>
</template>

<script>
export default {
  name: 'DrawioEditor',
  
  data() {
    return {
      iframeReady: false,
      // 使用本地部署的 Draw.io，lang=zh 设置中文界面
      iframeSrc: '/drawio/index.html?embed=1&proto=json&spin=1&ui=min&noSaveBtn=1&saveAndExit=0&noExitBtn=1&lang=zh'
    }
  },
  
  mounted() {
    window.addEventListener('message', this.handleMessage)
  },
  
  beforeDestroy() {
    window.removeEventListener('message', this.handleMessage)
  },
  
  methods: {
    onIframeLoad() {
      // iframe 加载完成后注入插件
      console.log('Draw.io iframe loaded')
    },
    
    handleMessage(evt) {
      // 确保消息来自 iframe
      if (evt.source !== this.$refs.drawioIframe?.contentWindow) {
        return
      }
      
      let data
      try {
        data = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data
      } catch (e) {
        return
      }
      
      console.log('Received from Draw.io:', data)
      
      // 处理初始化事件
      if (data.event === 'init') {
        this.initDrawio()
      }
      
      // 处理加载完成事件
      if (data.event === 'load') {
        this.injectMermaidPlugin()
      }
      
      // 处理插件就绪事件
      if (data.event === 'mermaid-import-ready') {
        this.iframeReady = true
        this.$emit('ready')
      }
      
      // 处理图表生成响应
      if (data.event === 'generateMermaid') {
        if (data.status === 'ok') {
          this.$emit('generate-success', data.data)
        } else {
          this.$emit('generate-error', {
            error: data.error,
            errorCode: data.errorCode
          })
        }
      }
    },
    
    initDrawio() {
      // 发送空白文档初始化编辑器
      this.postMessage({
        action: 'load',
        xml: '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>',
        autosave: 0
      })
    },
    
    injectMermaidPlugin() {
      // 动态注入 mermaid-import 插件
      const iframe = this.$refs.drawioIframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      const script = iframeDoc.createElement('script')
      script.src = '/drawio/plugins/mermaid-import.js'
      script.onload = () => {
        console.log('Mermaid plugin loaded')
      }
      iframeDoc.head.appendChild(script)
    },
    
    postMessage(data) {
      const iframe = this.$refs.drawioIframe
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify(data), '*')
      }
    },
    
    /**
     * 生成 Mermaid 图表
     * @param {string} mermaidText - Mermaid 语法文本
     * @param {Object} options - 配置选项
     */
    generateMermaid(mermaidText, options = {}) {
      if (!this.iframeReady) {
        this.$emit('generate-error', { error: 'Draw.io 尚未就绪' })
        return false
      }
      
      this.postMessage({
        action: 'generateMermaid',
        mermaid: mermaidText,
        options: {
          position: options.position || { x: 50, y: 50 },
          select: options.select !== false,
          center: options.center || false,
          editable: options.editable !== false,  // 默认生成可编辑图形
          scale: options.scale || 1.0
        }
      })
      
      return true
    },
    
    /**
     * 检查是否就绪
     */
    isReady() {
      return this.iframeReady
    }
  }
}
</script>

<style scoped>
.drawio-container {
  width: 100%;
  height: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.drawio-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
```

### 2. 创建 AI 对话面板组件

创建 `src/components/AiChatPanel.vue`：

```vue
<template>
  <div class="ai-chat-panel">
    <div class="chat-header">
      <h3>AI 图表生成</h3>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="['message', msg.type]"
      >
        <div class="message-content">{{ msg.content }}</div>
      </div>
    </div>
    
    <div class="chat-input">
      <el-select v-model="diagramType" placeholder="选择图表类型" style="width: 120px; margin-right: 10px;">
        <el-option label="流程图" value="flowchart" />
        <el-option label="时序图" value="sequence" />
        <el-option label="类图" value="class" />
        <el-option label="状态图" value="state" />
        <el-option label="ER图" value="er" />
        <el-option label="甘特图" value="gantt" />
      </el-select>
      
      <el-input
        v-model="userInput"
        type="textarea"
        :rows="3"
        placeholder="请描述您的业务流程..."
        @keyup.ctrl.enter.native="sendMessage"
      />
      
      <div class="input-actions">
        <el-checkbox v-model="editable">生成可编辑图形</el-checkbox>
        <el-button
          type="primary"
          :loading="loading"
          @click="sendMessage"
        >
          生成图表
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AiChatPanel',
  
  props: {
    drawioRef: {
      type: Object,
      default: null
    }
  },
  
  data() {
    return {
      userInput: '',
      diagramType: 'flowchart',
      editable: true,
      loading: false,
      messages: []
    }
  },
  
  methods: {
    async sendMessage() {
      if (!this.userInput.trim()) {
        this.$message.warning('请输入业务描述')
        return
      }
      
      // 添加用户消息
      this.messages.push({
        type: 'user',
        content: this.userInput
      })
      
      const prompt = this.userInput
      this.userInput = ''
      this.loading = true
      
      try {
        // 调用后端 AI 接口生成 Mermaid
        const response = await axios.post('/api/ai/generate-mermaid', {
          prompt: prompt,
          diagramType: this.diagramType
        })
        
        const mermaidText = response.data.mermaid
        
        // 添加 AI 响应消息
        this.messages.push({
          type: 'assistant',
          content: `已生成 ${this.getDiagramTypeName()} 图表`
        })
        
        // 发送到 Draw.io 生成图表
        if (this.drawioRef) {
          this.drawioRef.generateMermaid(mermaidText, {
            editable: this.editable,
            position: { x: 50, y: 50 }
          })
        }
        
      } catch (error) {
        this.messages.push({
          type: 'error',
          content: `生成失败: ${error.message}`
        })
        this.$message.error('图表生成失败')
      } finally {
        this.loading = false
        this.scrollToBottom()
      }
    },
    
    getDiagramTypeName() {
      const names = {
        flowchart: '流程图',
        sequence: '时序图',
        class: '类图',
        state: '状态图',
        er: 'ER图',
        gantt: '甘特图'
      }
      return names[this.diagramType] || '图表'
    },
    
    scrollToBottom() {
      this.$nextTick(() => {
        const container = this.$refs.messagesContainer
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    },
    
    // 处理 Draw.io 生成成功事件
    onGenerateSuccess(data) {
      this.messages.push({
        type: 'success',
        content: `图表已插入画布，共 ${data.cellCount} 个图形元素`
      })
      this.scrollToBottom()
    },
    
    // 处理 Draw.io 生成失败事件
    onGenerateError(error) {
      this.messages.push({
        type: 'error',
        content: `插入失败: ${error.error}`
      })
      this.scrollToBottom()
    }
  }
}
</script>

<style scoped>
.ai-chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-left: 1px solid #e0e0e0;
}

.chat-header {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.chat-header h3 {
  margin: 0;
  font-size: 16px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
}

.message {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  max-width: 90%;
}

.message.user {
  background: #e3f2fd;
  margin-left: auto;
}

.message.assistant {
  background: #f5f5f5;
}

.message.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.message.error {
  background: #ffebee;
  color: #c62828;
}

.chat-input {
  padding: 15px;
  border-top: 1px solid #e0e0e0;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}
</style>
```

### 3. 创建主页面布局

创建 `src/views/EditorPage.vue`：

```vue
<template>
  <div class="editor-page">
    <div class="editor-left">
      <DrawioEditor
        ref="drawioEditor"
        @ready="onDrawioReady"
        @generate-success="onGenerateSuccess"
        @generate-error="onGenerateError"
      />
    </div>
    <div class="editor-right">
      <AiChatPanel
        ref="aiChatPanel"
        :drawio-ref="drawioEditor"
      />
    </div>
  </div>
</template>

<script>
import DrawioEditor from '@/components/DrawioEditor.vue'
import AiChatPanel from '@/components/AiChatPanel.vue'

export default {
  name: 'EditorPage',
  
  components: {
    DrawioEditor,
    AiChatPanel
  },
  
  data() {
    return {
      drawioEditor: null
    }
  },
  
  mounted() {
    this.drawioEditor = this.$refs.drawioEditor
  },
  
  methods: {
    onDrawioReady() {
      this.$message.success('Draw.io 编辑器已就绪')
    },
    
    onGenerateSuccess(data) {
      this.$refs.aiChatPanel?.onGenerateSuccess(data)
    },
    
    onGenerateError(error) {
      this.$refs.aiChatPanel?.onGenerateError(error)
    }
  }
}
</script>

<style scoped>
.editor-page {
  display: flex;
  height: 100vh;
}

.editor-left {
  flex: 1;
  min-width: 0;
}

.editor-right {
  width: 350px;
  flex-shrink: 0;
}
</style>
```


## 部署配置

### 方式一：本地部署 Draw.io（推荐）

将 Draw.io 静态资源部署到前端项目中：

1. 复制 Draw.io 资源到 `public/drawio/` 目录：
```bash
# 复制核心文件
cp -r src/main/webapp/* your-vue-project/public/drawio/
```

2. 配置 Vue 开发服务器代理（`vue.config.js`）：
```javascript
module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // 后端服务地址
        changeOrigin: true
      }
    }
  }
}
```

3. 修改 `DrawioEditor.vue` 中的 iframe src：
```javascript
// lang=zh 设置中文界面
iframeSrc: '/drawio/index.html?embed=1&proto=json&spin=1&ui=min&lang=zh'
```

### 方式二：使用在线 Draw.io

如果不想本地部署，可以使用在线版本（注意跨域限制）：

```javascript
// 使用 embed.diagrams.net（专为嵌入设计），lang=zh 设置中文
iframeSrc: 'https://embed.diagrams.net/?embed=1&proto=json&spin=1&ui=min&lang=zh'
```

**注意**：在线版本无法加载自定义插件，需要使用 Draw.io 内置的 Mermaid 功能。

## API 接口约定

### 后端生成 Mermaid 接口

**请求**：
```
POST /api/ai/generate-mermaid
Content-Type: application/json

{
  "prompt": "用户的业务描述",
  "diagramType": "flowchart"  // flowchart | sequence | class | state | er | gantt
}
```

**响应**：
```json
{
  "success": true,
  "mermaid": "flowchart TD\n    A[开始] --> B[结束]",
  "diagramType": "flowchart"
}
```

### 图表类型映射

| 前端类型 | Mermaid 语法 | 支持原生编辑 |
|---------|-------------|-------------|
| flowchart | `flowchart TD` | ✅ |
| sequence | `sequenceDiagram` | ✅ |
| class | `classDiagram` | ✅ |
| state | `stateDiagram-v2` | ✅ |
| er | `erDiagram` | ✅ |
| gantt | `gantt` | ❌ |

## 消息通信协议

### 发送到 Draw.io

```javascript
// 生成图表
{
  action: 'generateMermaid',
  mermaid: 'flowchart TD\n    A --> B',
  options: {
    position: { x: 50, y: 50 },
    select: true,
    center: false,
    editable: true,  // true=原生图形, false=Mermaid数据
    scale: 1.0
  }
}
```

### 从 Draw.io 接收

**成功响应**：
```javascript
{
  event: 'generateMermaid',
  status: 'ok',
  data: {
    cellCount: 5
  }
}
```

**错误响应**：
```javascript
{
  event: 'generateMermaid',
  status: 'error',
  error: '错误信息',
  errorCode: 'PARSE_ERROR'
}
```

## 错误处理

### 错误代码

| 错误代码 | 描述 | 处理建议 |
|---------|------|---------|
| `INVALID_FORMAT` | 消息格式无效 | 检查请求参数 |
| `EMPTY_MERMAID` | Mermaid 文本为空 | 提示用户输入内容 |
| `PARSE_ERROR` | Mermaid 语法错误 | 显示错误详情，让用户修改 |
| `TIMEOUT` | 解析超时 | 简化图表或重试 |
| `INSERT_FAILED` | 插入失败 | 重试或刷新页面 |

### 错误处理示例

```javascript
onGenerateError(error) {
  const errorMessages = {
    'INVALID_FORMAT': '请求格式错误，请刷新页面重试',
    'EMPTY_MERMAID': '图表内容为空，请重新生成',
    'PARSE_ERROR': `Mermaid 语法错误: ${error.error}`,
    'TIMEOUT': '生成超时，请简化图表内容后重试',
    'INSERT_FAILED': '插入失败，请刷新页面重试'
  }
  
  const message = errorMessages[error.errorCode] || error.error
  this.$message.error(message)
}
```

## Vuex 状态管理（可选）

如果需要在多个组件间共享状态，可以创建 Vuex 模块：

```javascript
// src/store/modules/drawio.js
export default {
  namespaced: true,
  
  state: {
    ready: false,
    generating: false,
    lastError: null
  },
  
  mutations: {
    SET_READY(state, ready) {
      state.ready = ready
    },
    SET_GENERATING(state, generating) {
      state.generating = generating
    },
    SET_ERROR(state, error) {
      state.lastError = error
    }
  },
  
  actions: {
    setReady({ commit }, ready) {
      commit('SET_READY', ready)
    },
    
    generateMermaid({ commit, rootState }, { mermaid, options }) {
      commit('SET_GENERATING', true)
      commit('SET_ERROR', null)
      
      // 通过事件总线或 ref 调用 DrawioEditor 组件
      // ...
    }
  }
}
```

## 完整端到端流程

```
1. 用户在 AI 对话面板输入业务描述
   ↓
2. 前端调用后端 /api/ai/generate-mermaid 接口
   ↓
3. 后端调用 AI 模型生成 Mermaid 语法
   ↓
4. 前端收到 Mermaid 文本
   ↓
5. 调用 drawioEditor.generateMermaid(mermaidText, options)
   ↓
6. 通过 postMessage 发送到 Draw.io iframe
   ↓
7. mermaid-import.js 插件处理消息
   ↓
8. 解析 Mermaid 并插入画布
   ↓
9. 返回成功/失败响应
   ↓
10. 前端显示结果，用户可继续编辑
```

## 常见问题

### Q: iframe 一直显示加载中？
A: 确保发送了 `load` action 初始化编辑器，并正确注入了 mermaid-import 插件。

### Q: 收到 unknownMessage 错误？
A: 插件未正确加载。检查插件路径和注入时机。

### Q: 甘特图无法编辑？
A: 这是 Draw.io 的限制，甘特图不支持转换为原生图形，只能生成 Mermaid 数据格式。

### Q: 跨域问题？
A: 使用本地部署的 Draw.io，或确保 iframe src 和页面同源。

## 参考文档

- [Mermaid iframe API 文档](./MERMAID_IFRAME_API.md)
- [集成指南](./MERMAID_IFRAME_INTEGRATION_GUIDE.md)
- [故障排查](./MERMAID_IFRAME_TROUBLESHOOTING.md)
