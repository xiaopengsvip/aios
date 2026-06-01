import { useState, useEffect, useRef } from "react";
import { useChat } from "../hooks/useChat";
import { ChatMessage } from "../components/ChatMessage";
import { ModelSelector } from "../components/ModelSelector";
import { api } from "../services/api";

interface ChatProps {
  requireAuth?: (callback?: () => void) => boolean;
  isAuthed?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: string;
}

export function Chat({ requireAuth, isAuthed }: ChatProps) {
  const { messages, isStreaming, streamingContent, streamingReasoning, error, sendMessage, clearMessages, setError } = useChat();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showReasoning, setShowReasoning] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations
  useEffect(() => {
    if (isAuthed) {
      setConversationsLoading(true);
      api.getConversations()
        .then(d => setConversations(d.conversations || []))
        .catch(() => {})
        .finally(() => setConversationsLoading(false));
    }
  }, [isAuthed]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || !selectedModel) return;
    if (requireAuth && !requireAuth()) return;

    // Upload attachments first
    let attachmentUrls: string[] = [];
    if (attachments.length > 0) {
      for (const file of attachments) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const resp = await fetch(`${api.getPublicBaseUrl()}/api/files`, { method: 'POST', body: formData, credentials: 'include' });
          if (resp.ok) {
            const data = await resp.json();
            if (data.url) attachmentUrls.push(data.url);
          }
        } catch {}
      }
    }

    const text = input;
    const modelId = selectedModel.id;
    setInput("");
    setAttachments([]);
    await sendMessage(modelId, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files].slice(0, 5)); // max 5 files
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const loadConversation = async (convId: string) => {
    try {
      const data = await api.get(`/api/conversations/${convId}`);
      if (data.messages) {
        clearMessages();
        // Load messages into chat
        // This would need the useChat hook to support loading messages
      }
    } catch {}
  };

  const deleteConversation = async (convId: string) => {
    try {
      await api.delete(`/api/conversations/${convId}`);
      setConversations(prev => prev.filter(c => c.id !== convId));
    } catch {}
  };

  const exportConversation = async () => {
    try {
      const data = await api.get('/api/conversations/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `aios-chat-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="chat-layout">
      {/* Conversation sidebar */}
      {showSidebar && isAuthed && (
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <span>会话</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="btn-small" onClick={clearMessages} title="新对话">+</button>
              <button className="btn-small" onClick={exportConversation} title="导出">📥</button>
            </div>
          </div>
          <div className="conversation-list">
            {conversationsLoading && <div style={{ padding: 12, fontSize: 12, color: '#888', textAlign: 'center' }}>加载中...</div>}
            {!conversationsLoading && conversations.length === 0 && <div className="empty-hint">暂无会话</div>}
            {conversations.map(conv => (
              <div key={conv.id} className={`conversation-item ${conv.id === '' ? 'active' : ''}`} onClick={() => loadConversation(conv.id)}>
                <span className="conv-icon">💬</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="conv-title">{conv.title}</span>
                  <span style={{ fontSize: 10, color: '#666', display: 'block' }}>{conv.messageCount} 条 · {formatDate(conv.updatedAt)}</span>
                </div>
                <button className="btn-icon" style={{ fontSize: 11, opacity: 0.5 }} onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }} title="删除">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat main area */}
      <div className="chat-main">
        <div className="chat-topbar">
          {isAuthed && (
            <button className="btn-icon" onClick={() => setShowSidebar(!showSidebar)} title={showSidebar ? "隐藏侧边栏" : "显示侧边栏"}>☰</button>
          )}
          <ModelSelector selected={selectedModel} onSelect={setSelectedModel} />
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button className="btn-icon" onClick={() => setShowReasoning(!showReasoning)} title={showReasoning ? "隐藏推理" : "显示推理"} style={{ opacity: showReasoning ? 1 : 0.5 }}>🧠</button>
            <button className="btn-icon" onClick={clearMessages} title="新对话">+</button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && !isStreaming && (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <h3>{isAuthed ? "开始对话" : "AIOS AI 对话"}</h3>
              <p>{isAuthed ? "选择一个模型，输入你的问题" : "登录后即可开始对话"}</p>
              {selectedModel && (
                <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {["帮我写一段代码", "解释一下量子计算", "翻译这段话", "写一首诗"].map(q => (
                    <button key={q} className="chip" onClick={() => setInput(q)} style={{ fontSize: 12, cursor: 'pointer' }}>{q}</button>
                  ))}
                </div>
              )}
            </div>
          )}
          {messages.map(msg => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} reasoning={showReasoning ? msg.reasoning : undefined} />
          ))}
          {isStreaming && (
            <ChatMessage role="assistant" content={streamingContent} reasoning={showReasoning ? streamingReasoning : undefined} isStreaming />
          )}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Attachment preview */}
        {attachments.length > 0 && (
          <div style={{ display: 'flex', gap: 8, padding: '8px 16px', overflowX: 'auto', borderTop: '1px solid var(--border)' }}>
            {attachments.map((file, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: 'var(--bg)', borderRadius: 8, fontSize: 12, whiteSpace: 'nowrap' }}>
                <span>{file.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                <button onClick={() => removeAttachment(i)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div className="chat-input-bar">
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} multiple style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx,.txt,.json,.csv" />
          <button className="btn-icon" onClick={() => fileInputRef.current?.click()} title="添加附件" style={{ fontSize: 18, color: '#888' }}>📎</button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedModel ? "输入消息... (Enter 发送, Shift+Enter 换行)" : "请先选择模型"}
            disabled={isStreaming || !selectedModel}
            rows={1}
            style={{ resize: 'none', overflow: 'hidden' }}
          />
          <button className="btn-send" onClick={handleSend} disabled={isStreaming || !input.trim() || !selectedModel}>
            {isStreaming ? '⏳' : '➤'}
          </button>
        </div>
      </div>
    </div>
  );
}
