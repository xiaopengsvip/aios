import { useState, useCallback, useRef } from "react";
import { api } from "../services/api";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
  timestamp: Date;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingReasoning, setStreamingReasoning] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortRef = useRef(false);

  const sendMessage = useCallback(async (modelId: string, content: string) => {
    if (isStreaming || !content.trim()) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingContent("");
    setStreamingReasoning("");
    setError(null);
    abortRef.current = false;

    const chatMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    let fullContent = "";
    let fullReasoning = "";

    await api.streamChat(
      modelId, chatMessages, conversationId,
      (text) => { fullContent += text; setStreamingContent(fullContent); },
      (text) => { fullReasoning += text; setStreamingReasoning(fullReasoning); },
      (convId) => {
        if (convId) setConversationId(convId);
        const assistantMsg: Message = {
          id: `a-${Date.now()}`, role: "assistant",
          content: fullContent, reasoning: fullReasoning || undefined,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
        setIsStreaming(false);
        setStreamingContent("");
        setStreamingReasoning("");
      },
      (err) => { setError(err); setIsStreaming(false); }
    );
  }, [messages, isStreaming, conversationId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  return {
    messages, isStreaming, streamingContent, streamingReasoning, error,
    sendMessage, clearMessages, setError
  };
}
