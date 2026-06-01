import SwiftUI

struct SearchView: View {
    @State private var query = ""
    @State private var results: [GlobalSearchResult] = []
    @State private var isSearching = false
    @State private var error: String?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 12) {
                HStack {
                    TextField("搜索对话、文件、Agent...", text: $query)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit { search() }
                    Button { search() } label: {
                        Image(systemName: "magnifyingglass").foregroundColor(.indigo)
                    }
                    .disabled(query.isEmpty)
                }
                .padding(.horizontal)
                
                if isSearching { ProgressView("搜索中...") }
                if let error { Text(error).foregroundColor(.red).font(.caption) }
                
                List(results) { r in
                    HStack {
                        Text(typeIcon(r.type)).font(.title2)
                        VStack(alignment: .leading, spacing: 4) {
                            Text(r.title ?? r.name ?? "").font(.headline)
                            Text(r.content?.prefix(120) ?? r.description?.prefix(120) ?? "").font(.caption).foregroundColor(.secondary).lineLimit(2)
                        }
                        Spacer()
                        Text(r.type).font(.caption2).padding(.horizontal, 6).padding(.vertical, 2)
                            .background(Color.indigo.opacity(0.1)).cornerRadius(4)
                    }
                }
                .listStyle(.plain)
            }
            .navigationTitle("全局搜索")
        }
        .navigationViewStyle(.stack)
    }
    
    func search() {
        guard !query.isEmpty else { return }
        isSearching = true; error = nil
        Task {
            do {
                let resp: GlobalSearchResponse = try await APIClient.shared.request(
                    "/api/search", method: "POST", body: ["query": query]
                )
                results = resp.results ?? []
            } catch { self.error = error.localizedDescription }
            isSearching = false
        }
    }
    
    func typeIcon(_ type: String) -> String {
        switch type {
        case "conversation": return "💬"
        case "file": return "📄"
        case "agent": return "🤖"
        case "prompt": return "💡"
        case "knowledge": return "📚"
        default: return "🔍"
        }
    }
}

struct GlobalSearchResponse: Decodable { let results: [GlobalSearchResult]? }
struct GlobalSearchResult: Decodable, Identifiable {
    var id: String { (title ?? name ?? "") + (type) }
    let title: String?
    let name: String?
    let content: String?
    let description: String?
    let type: String
}
