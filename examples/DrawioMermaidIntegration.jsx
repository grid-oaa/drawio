import React, { useRef, useEffect, useState } from 'react';

/**
 * Draw.io Mermaid 集成组件
 * 
 * 该组件提供了一个完整的界面，用于将 Mermaid 文本发送到嵌入的 draw.io iframe
 * 并接收处理结果。
 * 
 * @example
 * ```jsx
 * import DrawioMermaidIntegration from './DrawioMermaidIntegration';
 * 
 * function App() {
 *   return <DrawioMermaidIntegration />;
 * }
 * ```
 */
function DrawioMermaidIntegration() {
    const iframeRef = useRef(null);
    const [mermaidText, setMermaidText] = useState(
        `flowchart TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作1]
    B -->|否| D[执行操作2]
    C --> E[结束]
    D --> E`
    );
    const [status, setStatus] = useState({ message: '', type: '' });
    const [iframeReady, setIframeReady] = useState(false);

    // Mermaid 示例模板
    const examples = {
        flowchart: `flowchart TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作1]
    B -->|否| D[执行操作2]
    C --> E[结束]
    D --> E`,
        
        sequence: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>Bob: 你好 Bob
    Bob->>Alice: 你好 Alice
    Alice->>Bob: 最近怎么样？
    Bob->>Alice: 很好，谢谢！`,
        
        class: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,
        
        state: `stateDiagram-v2
    [*] --> 待处理
    待处理 --> 处理中: 开始处理
    处理中 --> 已完成: 完成
    处理中 --> 失败: 出错
    失败 --> 待处理: 重试
    已完成 --> [*]`,
        
        er: `erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER {
        string name
        string email
        string phone
    }
    ORDER {
        int orderNumber
        date orderDate
        string status
    }
    LINE-ITEM {
        string productCode
        int quantity
        float price
    }`,
        
        gantt: `gantt
    title 项目开发计划
    dateFormat  YYYY-MM-DD
    section 需求分析
    需求收集           :a1, 2024-01-01, 7d
    需求评审           :after a1, 3d
    section 设计阶段
    架构设计           :2024-01-11, 5d
    详细设计           :2024-01-16, 7d
    section 开发阶段
    前端开发           :2024-01-23, 14d
    后端开发           :2024-01-23, 14d`
    };

    // 监听来自 draw.io 的消息
    useEffect(() => {
        const handleMessage = (evt) => {
            // 确保消息来自 iframe
            if (evt.source !== iframeRef.current?.contentWindow) {
                return;
            }

            let data;
            try {
                data = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data;
            } catch (e) {
                return;
            }

            // 处理 iframe 就绪事件
            if (data.event === 'init' || data.event === 'mermaid-import-ready') {
                setIframeReady(true);
                setStatus({ message: 'Draw.io 已就绪，可以开始生成图表', type: 'info' });
                console.log('Draw.io iframe ready');
            }

            // 处理 generateMermaid 响应
            if (data.event === 'generateMermaid') {
                if (data.status === 'ok') {
                    const cellCount = data.data?.cellCount || 0;
                    setStatus({
                        message: `✅ 图表生成成功！插入了 ${cellCount} 个图形元素`,
                        type: 'success'
                    });
                    console.log('Diagram generated successfully:', data);
                } else {
                    setStatus({
                        message: `❌ 图表生成失败：${data.error || '未知错误'}`,
                        type: 'error'
                    });
                    console.error('Diagram generation failed:', data);
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // 生成图表
    const generateDiagram = () => {
        const trimmedText = mermaidText.trim();
        
        if (!trimmedText) {
            setStatus({ message: '⚠️ 请输入 Mermaid 文本', type: 'error' });
            return;
        }

        if (!iframeReady) {
            setStatus({ message: '⏳ Draw.io 正在加载，请稍候...', type: 'info' });
            // 等待 iframe 就绪后重试
            setTimeout(generateDiagram, 1000);
            return;
        }

        setStatus({ message: '🔄 正在生成图表...', type: 'info' });

        // 发送消息到 draw.io iframe
        iframeRef.current?.contentWindow.postMessage(
            JSON.stringify({
                action: 'generateMermaid',
                mermaid: trimmedText,
                options: {
                    position: { x: 50, y: 50 },
                    select: true,
                    center: false
                }
            }),
            '*'
        );
    };

    // 清空输入
    const clearInput = () => {
        setMermaidText('');
        setStatus({ message: '', type: '' });
    };

    // 加载示例
    const loadExample = (type) => {
        if (examples[type]) {
            setMermaidText(examples[type]);
            setStatus({ message: `已加载 ${type} 示例`, type: 'info' });
        }
    };

    // 处理键盘快捷键 (Ctrl+Enter)
    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            generateDiagram();
        }
    };

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>🎨 Draw.io Mermaid 集成示例</h1>
            
            <div style={styles.inputSection}>
                <label htmlFor="mermaid-input" style={styles.label}>
                    Mermaid 文本：
                </label>
                <textarea
                    id="mermaid-input"
                    value={mermaidText}
                    onChange={(e) => setMermaidText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="在此输入 Mermaid 语法..."
                    style={styles.textarea}
                />
            </div>
            
            <div style={styles.buttonGroup}>
                <button onClick={generateDiagram} style={{...styles.button, ...styles.btnPrimary}}>
                    生成图表
                </button>
                <button onClick={clearInput} style={{...styles.button, ...styles.btnSecondary}}>
                    清空输入
                </button>
            </div>
            
            {status.message && (
                <div style={{...styles.statusSection, ...styles[status.type]}}>
                    {status.message}
                </div>
            )}
            
            <div style={styles.iframeContainer}>
                <iframe
                    ref={iframeRef}
                    src="https://app.diagrams.net/?embed=1&proto=json&spin=1"
                    title="Draw.io Editor"
                    style={styles.iframe}
                />
            </div>
            
            <div style={styles.examples}>
                <h3 style={styles.examplesTitle}>📝 示例模板</h3>
                <div style={styles.exampleButtons}>
                    <button onClick={() => loadExample('flowchart')} style={styles.exampleButton}>
                        流程图
                    </button>
                    <button onClick={() => loadExample('sequence')} style={styles.exampleButton}>
                        时序图
                    </button>
                    <button onClick={() => loadExample('class')} style={styles.exampleButton}>
                        类图
                    </button>
                    <button onClick={() => loadExample('state')} style={styles.exampleButton}>
                        状态图
                    </button>
                    <button onClick={() => loadExample('er')} style={styles.exampleButton}>
                        ER图
                    </button>
                    <button onClick={() => loadExample('gantt')} style={styles.exampleButton}>
                        甘特图
                    </button>
                </div>
            </div>
        </div>
    );
}

// 样式定义
const styles = {
    container: {
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif'
    },
    title: {
        color: '#333',
        marginTop: 0
    },
    inputSection: {
        marginBottom: '20px'
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontWeight: 600,
        color: '#555'
    },
    textarea: {
        width: '100%',
        minHeight: '200px',
        padding: '12px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontFamily: '"Courier New", monospace',
        fontSize: '14px',
        resize: 'vertical',
        boxSizing: 'border-box'
    },
    buttonGroup: {
        display: 'flex',
        gap: '10px',
        marginBottom: '20px'
    },
    button: {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    },
    btnPrimary: {
        backgroundColor: '#007bff',
        color: 'white'
    },
    btnSecondary: {
        backgroundColor: '#6c757d',
        color: 'white'
    },
    statusSection: {
        marginBottom: '20px',
        padding: '12px',
        borderRadius: '4px'
    },
    success: {
        backgroundColor: '#d4edda',
        border: '1px solid #c3e6cb',
        color: '#155724'
    },
    error: {
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        color: '#721c24'
    },
    info: {
        backgroundColor: '#d1ecf1',
        border: '1px solid #bee5eb',
        color: '#0c5460'
    },
    iframeContainer: {
        border: '1px solid #ddd',
        borderRadius: '4px',
        overflow: 'hidden',
        marginBottom: '20px'
    },
    iframe: {
        width: '100%',
        height: '600px',
        border: 'none',
        display: 'block'
    },
    examples: {
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
    },
    examplesTitle: {
        marginTop: 0,
        color: '#333'
    },
    exampleButtons: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px'
    },
    exampleButton: {
        padding: '8px 16px',
        backgroundColor: '#e9ecef',
        color: '#495057',
        fontSize: '13px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    }
};

export default DrawioMermaidIntegration;
