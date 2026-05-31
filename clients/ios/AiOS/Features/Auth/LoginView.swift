import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var isRegister = false
    @State private var email = ""
    @State private var password = ""
    @State private var username = ""
    @State private var error = ""
    @State private var loading = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 24) {
                Spacer()
                
                // Logo
                VStack(spacing: 12) {
                    RoundedRectangle(cornerRadius: 16)
                        .fill(LinearGradient(colors: [.indigo, .purple], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 72, height: 72)
                        .overlay(Text("A").font(.system(size: 32, weight: .bold)).foregroundColor(.white))
                    
                    Text("AIOS").font(.system(size: 28, weight: .bold))
                    Text("AI Workspace OS").font(.subheadline).foregroundColor(.secondary)
                }
                
                // Form
                VStack(spacing: 16) {
                    if isRegister {
                        TextField("用户名", text: $username)
                            .textFieldStyle(.roundedBorder)
                    }
                    
                    TextField("邮箱 / AI 账号", text: $email)
                        .textFieldStyle(.roundedBorder)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    
                    SecureField("密码", text: $password)
                        .textFieldStyle(.roundedBorder)
                    
                    if !error.isEmpty {
                        Text(error).font(.caption).foregroundColor(.red)
                            .padding(8)
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(8)
                    }
                    
                    Button(action: submit) {
                        if loading { ProgressView() } else { Text(isRegister ? "注册" : "登录").frame(maxWidth: .infinity) }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(.indigo)
                    .disabled(loading)
                }
                .padding(.horizontal, 32)
                
                Button(isRegister ? "已有账号？去登录" : "没有账号？去注册") {
                    isRegister.toggle()
                    error = ""
                }
                .font(.footnote)
                
                Spacer()
            }
        }
        .navigationViewStyle(.stack)
    }
    
    func submit() {
        loading = true
        error = ""
        Task {
            do {
                let resp: AuthResponse
                if isRegister {
                    resp = try await APIClient.shared.register(username: username, email: email, password: password)
                } else {
                    resp = try await APIClient.shared.login(email: email, password: password)
                }
                if resp.success, let user = resp.user {
                    authManager.saveUser(user)
                } else {
                    error = resp.message ?? "操作失败"
                }
            } catch {
                self.error = error.localizedDescription
            }
            loading = false
        }
    }
}
