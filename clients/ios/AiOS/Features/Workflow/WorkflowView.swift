import SwiftUI

struct WorkflowView: View {
    @State private var workflows: [WorkflowItem] = []
    @State private var isLoading = false
    @State private var executingId: String?
    @State private var result: String?
    @State private var input = ""
    @State private var error: String?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 12) {
                TextField("输入参数 (可选)", text: $input)
                    .textFieldStyle(.roundedBorder).padding(.horizontal)
                
                if isLoading { ProgressView() }
                else if workflows.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "bolt").font(.system(size: 48)).foregroundColor(.secondary)
                        Text("暂无工作流").font(.headline)
                    }
                } else {
                    List(workflows) { wf in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(wf.name).font(.headline)
                                if let desc = wf.description { Text(desc).font(.caption).foregroundColor(.secondary) }
                            }
                            Spacer()
                            Button { execute(wf) } label: {
                                if executingId == wf.id { ProgressView() }
                                else { Image(systemName: "play.fill").foregroundColor(.indigo) }
                            }
                            .disabled(executingId != nil)
                        }
                    }
                }
                
                if let result {
                    ScrollView {
                        Text(result).font(.system(.caption, design: .monospaced))
                            .padding().frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color(.systemGray6)).cornerRadius(8)
                    }.padding(.horizontal)
                }
            }
            .navigationTitle("工作流")
            .toolbar { Button("刷新") { load() } }
        }
        .navigationViewStyle(.stack)
        .task { load() }
    }
    
    func load() {
        isLoading = true
        Task {
            do {
                let resp: WorkflowsResponse = try await APIClient.shared.request("/api/workflows")
                workflows = resp.workflows ?? []
            } catch { self.error = error.localizedDescription }
            isLoading = false
        }
    }
    
    func execute(_ wf: WorkflowItem) {
        executingId = wf.id; result = nil; error = nil
        Task {
            do {
                let resp: [String: AnyCodable] = try await APIClient.shared.request(
                    "/api/workflows/\(wf.id)/execute", method: "POST",
                    body: ["input": input.isEmpty ? nil : input]
                )
                result = String(describing: resp)
            } catch { self.error = error.localizedDescription }
            executingId = nil
        }
    }
}

struct WorkflowsResponse: Decodable { let workflows: [WorkflowItem]? }
struct WorkflowItem: Decodable, Identifiable { let id: String; let name: String; let description: String? }
struct AnyCodable: Decodable {}
