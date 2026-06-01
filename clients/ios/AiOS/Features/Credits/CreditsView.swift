import SwiftUI

struct CreditsView: View {
    @State private var balance: CreditsBalance?
    @State private var transactions: [Transaction] = []
    @State private var isLoading = false
    @State private var error: String?
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading { ProgressView() }
                else {
                    VStack(spacing: 16) {
                        // Balance card
                        VStack(spacing: 8) {
                            Text(balance?.balance ?? "0").font(.system(size: 36, weight: .bold))
                            Text("可用积分").font(.subheadline).foregroundColor(.secondary)
                        }
                        .frame(maxWidth: .infinity).padding(24)
                        .background(LinearGradient(colors: [.indigo.opacity(0.8), .purple.opacity(0.6)], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .cornerRadius(16).foregroundColor(.white).padding(.horizontal)
                        
                        Text("交易记录").font(.headline).frame(maxWidth: .infinity, alignment: .leading).padding(.horizontal)
                        
                        if transactions.isEmpty {
                            Text("暂无记录").foregroundColor(.secondary)
                        } else {
                            List(transactions) { t in
                                HStack {
                                    Text(t.type == "topup" ? "💰 充值" : "📤 消费")
                                    Spacer()
                                    Text("\(t.amount > 0 ? "+" : "")\(t.amount)")
                                        .foregroundColor(t.amount > 0 ? .green : .red).bold()
                                    Text(t.createdAt.prefix(10)).font(.caption).foregroundColor(.secondary)
                                }
                            }
                        }
                    }
                }
            }
            .navigationTitle("积分")
            .toolbar { Button("刷新") { load() } }
        }
        .navigationViewStyle(.stack)
        .task { load() }
    }
    
    func load() {
        isLoading = true
        Task {
            do {
                async let bal: CreditsBalanceResp = APIClient.shared.request("/api/credits/balance")
                async let tx: TransactionsResp = APIClient.shared.request("/api/credits/transactions")
                let (b, t) = try await (bal, tx)
                balance = b.balance != nil ? CreditsBalance(balance: b.balance!) : nil
                transactions = t.transactions ?? []
            } catch { self.error = error.localizedDescription }
            isLoading = false
        }
    }
}

struct CreditsBalance: Decodable { let balance: String }
struct CreditsBalanceResp: Decodable { let balance: String? }
struct TransactionsResp: Decodable { let transactions: [Transaction]? }
struct Transaction: Decodable, Identifiable {
    var id: String { UUID().uuidString }
    let type: String
    let amount: Double
    let createdAt: String
}
