'use client';

import { create } from 'zustand';
import type { Conversation, Message, Model } from '@/types';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  selectedModel: Model | null;
  isLoading: boolean;
  isStreaming: boolean;

  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, data: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, data: Partial<Message>) => void;
  setSelectedModel: (model: Model | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;
  clear: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  selectedModel: null,
  isLoading: false,
  isStreaming: false,

  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) =>
    set((s) => ({ conversations: [conversation, ...s.conversations] })),
  updateConversation: (id, data) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id ? { ...c, ...data } : c,
      ),
      currentConversation:
        s.currentConversation?.id === id
          ? { ...s.currentConversation, ...data }
          : s.currentConversation,
    })),
  removeConversation: (id) =>
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      currentConversation:
        s.currentConversation?.id === id ? null : s.currentConversation,
    })),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  updateMessage: (id, data) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...data } : m)),
    })),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  clear: () =>
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      isLoading: false,
      isStreaming: false,
    }),
}));
