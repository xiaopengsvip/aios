import SwiftUI

struct MarketplaceView: View {
    @State private var items: [MarketItem] = []
    @State private var type = "all"
    @State private var search = ""
    @State private var isLoading = false
    @State private var error: String?
    
    let types = [("all","全部"),("agent","Agent"),("prompt","提示词"),("workflow","工作流")]
    
    var body: some View {
        NavigationView {
            VStack(spacing: 12) {
                // Type filter
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(types, id: \.0) { k, l in
                            Button(l) { type = k; load() }
                                .buttonStyle(.bordered).tint(type == k ? .indigo : .gray)
                        }
                    }
                }.padding(.horizontal)
                
                if isLoading { ProgressView() }
                else if items.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "bag").font(.system(size: 48)).foregroundColor(.secondary)
                        Text("暂无数据").font(.headline)
                    }
                } else {
                    ScrollView {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 160))], spacing: 12) {
                            ForEach(items) { item in
                                VStack(alignment: .leading, spacing: 8) {
                                    Text(itemIcon(item.type)).font(.system(size: 32))
                                    Text(item.name).font(.headline).lineLimit(1)
                                    Text(item.description ?? "").font(.caption).foregroundColor(.secondary).lineLimit(2)
                                    HStack {
                                        Text("安装 \(item.installCount ?? 0)").font(.caption2)
                                        Spacer()
                                        Text("⭐ \(item.rating.map { String($0) } ?? "-")").font(.caption2)
                                    }
                                }
                                .padding().background(Color(.systemBackground))
                                .cornerRadius(12).shadow(color: .black.opacity(0.05), radius: 2)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("应用市场")
        }
        .navigationViewStyle(.stack)
        .task { load() }
    }
    
    func load() {
        isLoading = true
        Task {
            do {
                let resp: MarketplaceResponse = try await APIClient.shared.request("/api/marketplace?type=\(type)")
                items = resp.items ?? []
            } catch { self.error = error.localizedDescription }
            isLoading = false
        }
    }
    
    func itemIcon(_ type: String?) -> String {
        switch type {
        case "agent": return "🤖"
        case "workflow": return "⚡"
        default: return "💡"
        }
    }
}

struct MarketplaceResponse: Decodable { let items: [MarketItem]? }
struct MarketItem: Decodable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let type: String?
    let installCount: Int?
    let rating: Double?
}
