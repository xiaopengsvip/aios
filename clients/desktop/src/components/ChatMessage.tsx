import { useState } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  isStreaming?: boolean;
  modelName?: string;
}

export function ChatMessage({ role, content, reasoning, isStreaming, modelName }: ChatMessageProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const isUser = role === "user";

  return (
    <div className={`message ${isUser ? "message-user" : "message-assistant"}`}>
      {!isUser && (
        <div className="message-header">
          <span className="message-avatar">🤖</span>
          {modelName && <span className="message-model">{modelName}</span>}
        </div>
      )}

      {reasoning && (
        <div className="reasoning-block">
          <button className="reasoning-toggle" onClick={() => setShowReasoning(!showReasoning)}>
            <span>🧠 思考过程</span>
            <span>{showReasoning ? "▲" : "▼"}</span>
          </button>
          {showReasoning && <div className="reasoning-content">{reasoning}</div>}
        </div>
      )}

      <div className={`message-bubble ${isUser ? "bubble-user" : "bubble-assistant"}`}>
        {content || (isStreaming ? '<span class="typing-cursor">正在思考...</span>' : "")}
        {isStreaming && content && <span className="typing-cursor">▊</span>}
      </div>
    </div>
  );
}
