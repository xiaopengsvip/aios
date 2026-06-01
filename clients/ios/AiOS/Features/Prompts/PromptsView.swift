import SwiftUI

struct PromptsView: View {
    @State private var prompts: [PromptItem] = []
    @State private var isLoading = false
    @State private var copiedId: String?
    @State private var error: String?
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading { ProgressView() }
                else if prompts.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "lightbulb").font(.system(size: 48)).foregroundColor(.secondary)
                        Text("暂无提示词").font(.headline)
                    }
                } else {
                    List(prompts) { p in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text(p.title).font(.headline)
                                if let cat = p.category {
                                    Text(cat).font(.caption2).padding(.horizontal, 6).padding(.vertical, 2)
                                        .background(Color.indigo.opacity(0.1)).cornerRadius(4)
                                }
                                Spacer()
                                Button {
                                    UIPasteboard.general.string = p.content
                                    copiedId = p.id
                                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) { copiedId = nil }
                                } label: {
                                    Image(systemName: copiedId == p.id ? "checkmark" : "doc.on.doc")
                                        .foregroundColor(.indigo)
                                }
                            }
                            Text(p.content).font(.body).foregroundColor(.secondary).lineLimit(4)
                        }
                        .padding(.vertical, 4)
                    }
                }
            }
            .navigationTitle("提示词库")
            .toolbar { Button("刷新") { load() } }
        }
        .navigationViewStyle(.stack)
        .task { load() }
    }
    
    func load() {
        isLoading = true
        Task {
            do {
                let resp: PromptsResponse = try await APIClient.shared.request("/api/prompts")
                prompts = resp.prompts ?? []
            } catch { self.error = error.localizedDescription }
            isLoading = false
        }
    }
}

struct PromptsResponse: Decodable { let prompts: [PromptItem]? }
struct PromptItem: Decodable, Identifiable {
    let id: String
    let title: String
    let content: String
    let category: String?
}
