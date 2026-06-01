import SwiftUI

struct KnowledgeView: View {
    @State private var bases: [KnowledgeBase] = []
    @State private var selectedBase: String = ""
    @State private var query = ""
    @State private var results: [SearchResult] = []
    @State private var isLoading = false
    @State private var isSearching = false
    @State private var error: String?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 12) {
                // Base selector
                Picker("知识库", selection: $selectedBase) {
                    Text("选择知识库").tag("")
                    ForEach(bases) { b in Text(b.name).tag(b.id) }
                }
                .pickerStyle(.menu).padding(.horizontal)
                
                // Search bar
                HStack {
                    TextField("搜索知识库...", text: $query)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit { search() }
                    Button { search() } label: {
                        Image(systemName: "magnifyingglass").foregroundColor(.indigo)
                    }
                    .disabled(query.isEmpty || selectedBase.isEmpty)
                }
                .padding(.horizontal)
                
                if isSearching { ProgressView("搜索中...") }
                
                if let error { Text(error).foregroundColor(.red).font(.caption) }
                
                List(results) { r in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text(r.document ?? "未知").font(.caption).foregroundColor(.indigo)
                            Spacer()
                            Text("相关度 \(Int(r.score * 100))%").font(.caption2).foregroundColor(.secondary)
                        }
                        Text(r.content).font(.body).lineLimit(5)
                    }
                    .padding(.vertical, 4)
                }
                .listStyle(.plain)
            }
            .navigationTitle("知识库")
            .toolbar { Button("刷新") { loadBases() } }
        }
        .navigationViewStyle(.stack)
        .task { loadBases() }
    }
    
    func loadBases() {
        isLoading = true
        Task {
            do {
                let resp: KnowledgeBasesResponse = try await APIClient.shared.request("/api/knowledge")
                bases = resp.knowledgeBases ?? []
            } catch { self.error = error.localizedDescription }
            isLoading = false
        }
    }
    
    func search() {
        guard !query.isEmpty, !selectedBase.isEmpty else { return }
        isSearching = true; error = nil
        Task {
            do {
                let resp: KnowledgeSearchResponse = try await APIClient.shared.request(
                    "/api/knowledge/search", method: "POST",
                    body: ["query": query, "knowledgeBaseId": selectedBase]
                )
                results = resp.results ?? []
            } catch { self.error = error.localizedDescription }
            isSearching = false
        }
    }
}

struct KnowledgeBasesResponse: Decodable { let knowledgeBases: [KnowledgeBase]? }
struct KnowledgeBase: Decodable, Identifiable { let id: String; let name: String; let chunkCount: Int? }
struct KnowledgeSearchResponse: Decodable { let results: [SearchResult]? }
struct SearchResult: Decodable, Identifiable {
    var id: String { content }
    let content: String
    let document: String?
    let score: Double
}
