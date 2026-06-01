import { useState, useCallback } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  isStreaming?: boolean;
  modelName?: string;
}

/** Simple markdown renderer (no dependencies) */
function renderMarkdown(text: string): string {
  if (!text) return '';
  let html = text
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="code-block"><code class="lang-$1">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr />')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Line breaks
    .replace(/\n/g, '<br />');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>(?:<br \/>)?)+/g, match => {
    return '<ul>' + match.replace(/<br \/>/g, '') + '</ul>';
  });

  return html;
}

/** Copy button for code blocks */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button onClick={handleCopy} style={{
      position: 'absolute', top: 6, right: 6, padding: '2px 8px',
      fontSize: 11, borderRadius: 4, background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)', color: '#aaa', cursor: 'pointer',
    }}>
      {copied ? '✓' : 'Copy'}
    </button>
  );
}

export function ChatMessage({ role, content, reasoning, isStreaming, modelName }: ChatMessageProps) {
  const [showReasoning, setShowReasoning] = useState(false);
  const isUser = role === "user";

  const renderContent = () => {
    if (!content && isStreaming) {
      return <span style={{ color: '#888' }}>正在思考...</span>;
    }
    // Check for code blocks and render them with copy buttons
    const parts = content.split(/(```\w*\n[\s\S]*?```)/g);
    return parts.map((part, i) => {
      const codeMatch = part.match(/```(\w*)\n([\s\S]*?)```/);
      if (codeMatch) {
        return (
          <div key={i} style={{ position: 'relative', margin: '8px 0' }}>
            <CopyButton text={codeMatch[2]} />
            <pre style={{
              padding: 12, borderRadius: 8, overflow: 'auto',
              background: '#1e1e2e', color: '#cdd6f4',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
              lineHeight: 1.5, margin: 0,
            }}>
              <code>{codeMatch[2]}</code>
            </pre>
          </div>
        );
      }
      // Regular markdown content
      return <span key={i} dangerouslySetInnerHTML={{ __html: renderMarkdown(part) }} />;
    });
  };

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
          {showReasoning && (
            <div className="reasoning-content" style={{
              padding: 12, marginTop: 4, borderRadius: 8,
              background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)',
              fontSize: 13, lineHeight: 1.6, maxHeight: 300, overflow: 'auto',
            }}>
              {reasoning}
            </div>
          )}
        </div>
      )}

      <div className={`message-bubble ${isUser ? "bubble-user" : "bubble-assistant"}`}>
        {renderContent()}
        {isStreaming && content && <span className="typing-cursor">▊</span>}
      </div>
    </div>
  );
}
