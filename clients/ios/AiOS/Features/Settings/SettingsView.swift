import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var authManager: AuthManager
    
    var body: some View {
        NavigationView {
            List {
                // Profile
                if let user = authManager.currentUser {
                    Section {
                        HStack(spacing: 14) {
                            Circle()
                                .fill(Color.indigo.opacity(0.15))
                                .frame(width: 56, height: 56)
                                .overlay(Text(String((user.displayName ?? user.username).prefix(1))).font(.title2).foregroundColor(.indigo))
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(user.displayName ?? user.username).font(.headline)
                                if let email = user.email { Text(email).font(.caption).foregroundColor(.secondary) }
                                Text("AI: \(user.numericAccount ?? "-")").font(.caption).foregroundColor(.indigo)
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .trailing) {
                                Text("余额").font(.caption).foregroundColor(.secondary)
                                Text("\(user.balance ?? "0")").font(.headline).foregroundColor(.indigo)
                            }
                        }
                    }
                }
                
                Section("通用") {
                    HStack { Label("深色模式", systemImage: "moon.fill"); Spacer(); Text("跟随系统").foregroundColor(.secondary) }
                    HStack { Label("语言", systemImage: "globe"); Spacer(); Text("简体中文").foregroundColor(.secondary) }
                    HStack { Label("默认模型", systemImage: "cpu"); Spacer(); Text("mimo-v2.5-pro").foregroundColor(.secondary) }
                }
                
                Section("关于") {
                    HStack { Label("版本", systemImage: "info.circle"); Spacer(); Text("v1.0.0").foregroundColor(.secondary) }
                    NavigationLink { Text("使用条款") } label: { Label("使用条款", systemImage: "doc.text") }
                    NavigationLink { Text("隐私政策") } label: { Label("隐私政策", systemImage: "lock.shield") }
                }
                
                Section {
                    Button(role: .destructive) {
                        authManager.logout()
                    } label: {
                        HStack {
                            Spacer()
                            Label("退出登录", systemImage: "rectangle.portrait.and.arrow.right")
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("设置")
        }
        .navigationViewStyle(.stack)
    }
}
