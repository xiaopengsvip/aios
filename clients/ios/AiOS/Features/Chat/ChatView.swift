import SwiftUI

struct ChatMessage: Identifiable {
    let id = UUID()
    let role: String
    var content: String
    var reasoning: String = ""
}

struct ChatView: View {
    @State private var messages: [ChatMessage] = []
    @State private var input = ""
    @State private var models: [AIModel] = []
    @State private var selectedModel: AIModel? = nil
    @State private var isStreaming = false
    @State private var streamingContent = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Model selector
                if !models.isEmpty {
                    Picker("模型", selection: $selectedModel) {
                        ForEach(models) { model in
                            Text(model.displayTitle).tag(model as AIModel?)
                        }
                    }
                    .pickerStyle(.menu)
                    .padding(8)
                }
                
                // Messages
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(messages) { msg in
                                MessageRow(message: msg)
                                    .id(msg.id)
                            }
                            if isStreaming && !streamingContent.isEmpty {
                                MessageRow(message: ChatMessage(role: "assistant", content: streamingContent))
                                    .id("streaming")
                            }
                        }
                        .padding()
                    }
                    .onChange(of: messages.count) { _ in
                        if let last = messages.last { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
                
                Divider()
                
                // Input bar
                HStack(spacing: 12) {
                    TextField("输入消息...", text: $input, axis: .vertical)
                        .textFieldStyle(.roundedBorder)
                        .lineLimit(1...5)
                    
                    Button(action: send) {
                        Image(systemName: "arrow.up.circle.fill")
                            .font(.title2)
                            .foregroundColor(input.isEmpty || isStreaming ? .gray : .indigo)
                    }
                    .disabled(input.isEmpty || isStreaming || selectedModel == nil)
                }
                .padding()
            }
            .navigationTitle("对话")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("清空") { messages = [] }
                }
            }
        }
        .navigationViewStyle(.stack)
        .task { loadModels() }
    }
    
    func loadModels() {
        Task {
            do {
                let resp = try await APIClient.shared.getModels()
                models = resp.models
                selectedModel = models.first { $0.name == "mimo-v2.5-pro" } ?? models.first
            } catch {}
        }
    }
    
    func send() {
        guard let model = selectedModel, !input.isEmpty else { return }
        let text = input
        input = ""
        
        messages.append(ChatMessage(role: "user", content: text))
        isStreaming = true
        streamingContent = ""
        
        let chatMsgs = messages.map { ["role": $0.role, "content": $0.content] }
        
        APIClient.shared.streamChat(
            modelId: model.id, messages: chatMsgs, conversationId: nil,
            onChunk: { chunk in streamingContent += chunk },
            onReasoning: { _ in },
            onDone: { _ in
                DispatchQueue.main.async {
                    messages.append(ChatMessage(role: "assistant", content: streamingContent))
                    streamingContent = ""
                    isStreaming = false
                }
            },
            onError: { err in
                DispatchQueue.main.async {
                    messages.append(ChatMessage(role: "assistant", content: "错误: \(err)"))
                    isStreaming = false
                }
            }
        )
    }
}

struct MessageRow: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.role == "user" { Spacer(minLength: 60) }
            
            VStack(alignment: message.role == "user" ? .trailing : .leading, spacing: 4) {
                if message.role != "user" {
                    Label("AI", systemImage: "brain.head.profile")
                        .font(.caption2).foregroundColor(.indigo)
                }
                
                Text(message.content)
                    .padding(12)
                    .background(message.role == "user" ? Color.indigo : Color(.systemGray6))
                    .foregroundColor(message.role == "user" ? .white : .primary)
                    .cornerRadius(16)
            }
            
            if message.role != "user" { Spacer(minLength: 60) }
        }
    }
}
