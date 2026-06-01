import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            ChatView()
                .tabItem { Label("对话", systemImage: "bubble.left.and.bubble.right") }
            
            AgentView()
                .tabItem { Label("Agent", systemImage: "brain.head.profile") }
            
            ImageGenerationView()
                .tabItem { Label("绘图", systemImage: "paintbrush") }
            
            SearchView()
                .tabItem { Label("搜索", systemImage: "magnifyingglass") }
            
            MoreView()
                .tabItem { Label("更多", systemImage: "ellipsis.circle") }
        }
        .tint(.indigo)
    }
}

struct MoreView: View {
    let features: [(String, String, AnyView)] = [
        ("视频生成", "video", AnyView(VideoGenerationView())),
        ("音频生成", "music.note", AnyView(AudioGenerationView())),
        ("文件管理", "folder", AnyView(FilesView())),
        ("知识库", "books.vertical", AnyView(KnowledgeView())),
        ("工作流", "bolt", AnyView(WorkflowView())),
        ("应用市场", "bag", AnyView(MarketplaceView())),
        ("提示词库", "lightbulb", AnyView(PromptsView())),
        ("使用统计", "chart.bar", AnyView(UsageView())),
        ("积分", "creditcard", AnyView(CreditsView())),
        ("设置", "gearshape", AnyView(SettingsView())),
    ]
    
    var body: some View {
        NavigationView {
            List(features, id: \.0) { name, icon, view in
                NavigationLink(destination: view) {
                    HStack(spacing: 12) {
                        Image(systemName: icon)
                            .foregroundColor(.indigo)
                            .frame(width: 28)
                        Text(name)
                    }
                    .padding(.vertical, 4)
                }
            }
            .navigationTitle("更多功能")
        }
        .navigationViewStyle(.stack)
    }
}
