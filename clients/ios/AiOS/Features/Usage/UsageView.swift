import SwiftUI

struct UsageView: View {
    @State private var stats: UsageStats?
    @State private var isLoading = false
    @State private var error: String?
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading { ProgressView() }
                else if let s = stats {
                    ScrollView {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 140))], spacing: 12) {
                            StatCard(value: "\(s.totalMessages ?? 0)", label: "总消息数", icon: "bubble.left.and.bubble.right")
                            StatCard(value: "\(s.totalTokens ?? 0)", label: "总 Token", icon: "character.cursor.ibeam")
                            StatCard(value: "\(s.totalConversations ?? 0)", label: "对话数", icon: "message")
                            StatCard(value: "\(s.totalFiles ?? 0)", label: "文件数", icon: "folder")
                        }
                        .padding()
                    }
                } else {
                    VStack(spacing: 16) {
                        Image(systemName: "chart.bar").font(.system(size: 48)).foregroundColor(.secondary)
                        Text("暂无统计数据").font(.headline)
                    }
                }
            }
            .navigationTitle("使用统计")
            .toolbar { Button("刷新") { load() } }
        }
        .navigationViewStyle(.stack)
        .task { load() }
    }
    
    func load() {
        isLoading = true
        Task {
            do {
                stats = try await APIClient.shared.request("/api/usage")
            } catch { self.error = error.localizedDescription }
            isLoading = false
        }
    }
}

struct StatCard: View {
    let value: String
    let label: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon).font(.title2).foregroundColor(.indigo)
            Text(value).font(.title2.bold())
            Text(label).font(.caption).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity).padding()
        .background(Color(.systemBackground))
        .cornerRadius(12).shadow(color: .black.opacity(0.05), radius: 2)
    }
}

struct UsageStats: Decodable {
    let totalMessages: Int?
    let totalTokens: Int?
    let totalConversations: Int?
    let totalFiles: Int?
}
