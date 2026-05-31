import SwiftUI

struct AgentView: View {
    @State private var agents: [Agent] = []
    @State private var selectedAgent: Agent? = nil
    @State private var executeInput = ""
    @State private var executeResult: AgentExecutionResult? = nil
    @State private var isExecuting = false
    
    var body: some View {
        NavigationView {
            Group {
                if agents.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "brain.head.profile").font(.system(size: 48)).foregroundColor(.secondary)
                        Text("暂无 Agent").font(.headline)
                    }
                } else {
                    ScrollView {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 280))], spacing: 12) {
                            ForEach(agents) { agent in
                                AgentCard(agent: agent)
                                    .onTapGesture { selectedAgent = agent }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Agent")
            .toolbar {
                Button("刷新") { loadAgents() }
            }
        }
        .navigationViewStyle(.stack)
        .task { loadAgents() }
        .sheet(item: $selectedAgent) { agent in
            ExecuteSheet(agent: agent)
        }
    }
    
    func loadAgents() {
        Task {
            do {
                let resp = try await APIClient.shared.getAgents()
                agents = resp.agents
            } catch {}
        }
    }
}

struct AgentCard: View {
    let agent: Agent
    
    var body: some View {
        HStack(spacing: 14) {
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.indigo.opacity(0.15))
                .frame(width: 44, height: 44)
                .overlay(Text(String(agent.name.prefix(1))).font(.headline).foregroundColor(.indigo))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(agent.name).font(.headline)
                Text("执行 \(agent.runCount ?? "0") 次").font(.caption).foregroundColor(.secondary)
            }
            Spacer()
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 2)
    }
}

struct ExecuteSheet: View {
    let agent: Agent
    @State private var input = ""
    @State private var result: AgentExecutionResult? = nil
    @State private var isExecuting = false
    @Environment(\.dismiss) var dismiss
    
    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                TextEditor(text: $input)
                    .frame(height: 120)
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(Color(.systemGray4)))
                    .padding(.horizontal)
                
                if isExecuting { ProgressView() }
                
                if let r = result {
                    ScrollView {
                        Text(r.output ?? r.error ?? "无输出")
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                    }
                    .padding(.horizontal)
                }
                
                Button("执行") { execute() }
                    .buttonStyle(.borderedProminent)
                    .tint(.indigo)
                    .disabled(input.isEmpty || isExecuting)
                
                Spacer()
            }
            .navigationTitle(agent.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { Button("关闭") { dismiss() } }
        }
    }
    
    func execute() {
        isExecuting = true
        result = nil
        Task {
            do {
                result = try await APIClient.shared.executeAgent(id: agent.id, input: input)
            } catch {
                result = AgentExecutionResult(output: nil, status: "error", error: error.localizedDescription)
            }
            isExecuting = false
        }
    }
}
