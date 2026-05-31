import { useState, useEffect, useRef } from "react";
import { useChat, Message } from "../hooks/useChat";
import { ChatMessage } from "../components/ChatMessage";
import { ModelSelector } from "../components/ModelSelector";
import { api } from "../services/api";

export function Chat() {
  const { messages, isStreaming, streamingContent, streamingReasoning, error, sendMessage, clearMessages, setError } = useChat();
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getConversations().then(d => setConversations(d.conversations || [])).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || !selectedModel) return;
    const text = input;
    setInput("");
    await sendMessage(selectedModel.id, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-layout">
      {/* Conversation sidebar */}
      {showSidebar && (
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <span>会话</span>
            <button className="btn-small" onClick={clearMessages}>+ 新对话</button>
          </div>
          <div className="conversation-list">
            {conversations.map(conv => (
              <div key={conv.id} className="conversation-item">
                <span className="conv-icon">💬</span>
                <span className="conv-title">{conv.title}</span>
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="empty-hint">暂无会话</div>
            )}
          </div>
        </div>
      )}

      {/* Chat main area */}
      <div className="chat-main">
        {/* Top bar */}
        <div className="chat-topbar">
          <button className="btn-icon" onClick={() => setShowSidebar(!showSidebar)}>☰</button>
          <ModelSelector selected={selectedModel} onSelect={setSelectedModel} />
          <button className="btn-icon" onClick={clearMessages}>+</button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && !isStreaming && (
            <div className="chat-empty">
              <div className="chat-empty-icon">💬</div>
              <h3>开始对话</h3>
              <p>选择一个模型，输入你的问题</p>
            </div>
          )}
          {messages.map(msg => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} reasoning={msg.reasoning} />
          ))}
          {isStreaming && (
            <ChatMessage
              role="assistant"
              content={streamingContent}
              reasoning={streamingReasoning}
              isStreaming
            />
          )}
          {error && (
            <div className="error-banner">
              <span>⚠️ {error}</span>
              <button onClick={() => setError(null)}>✕</button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="chat-input-bar">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedModel ? "输入消息... (Enter 发送, Shift+Enter 换行)" : "请先选择模型"}
            disabled={isStreaming || !selectedModel}
            rows={1}
          />
          <button className="btn-send" onClick={handleSend} disabled={isStreaming || !input.trim() || !selectedModel}>
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
