import Foundation

class APIClient: ObservableObject {
    static let shared = APIClient()
    private let baseURL = "https://aios.vios.top"
    private let session: URLSession
    
    init() {
        let config = URLSessionConfiguration.default
        config.httpCookieStorage = HTTPCookieStorage.shared
        config.httpShouldSetCookies = true
        session = URLSession(configuration: config)
    }
    
    func request<T: Decodable>(_ path: String, method: String = "GET", body: Any? = nil) async throws -> T {
        let url = URL(string: "\(baseURL)\(path)")!
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let body = body {
            request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        }
        
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else { throw APIError.invalidResponse }
        guard httpResponse.statusCode < 400 else {
            let errorBody = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            throw APIError.serverError(errorBody?["error"] as? String ?? "HTTP \(httpResponse.statusCode)")
        }
        
        return try JSONDecoder().decode(T.self, from: data)
    }
    
    // Auth
    func login(email: String, password: String) async throws -> AuthResponse {
        try await request("/api/auth/login", method: "POST", body: ["email": email, "password": password])
    }
    
    func register(username: String, email: String, password: String) async throws -> AuthResponse {
        try await request("/api/auth/register", method: "POST", body: ["username": username, "email": email, "password": password])
    }
    
    func getMe() async throws -> UserInfo {
        try await request("/api/auth/me")
    }
    
    func logout() async throws {
        let _: EmptyResponse = try await request("/api/auth/logout", method: "POST")
    }
    
    // Models
    func getModels() async throws -> ModelsResponse {
        try await request("/api/models")
    }
    
    // Conversations
    func getConversations() async throws -> ConversationsResponse {
        try await request("/api/conversations")
    }
    
    // Agents
    func getAgents() async throws -> AgentsResponse {
        try await request("/api/agents")
    }
    
    func executeAgent(id: String, input: String) async throws -> AgentExecutionResult {
        try await request("/api/agents/\(id)/execute", method: "POST", body: ["input": input])
    }
    
    // Chat SSE Stream
    func streamChat(modelId: String, messages: [[String: String]], conversationId: String?,
                    onChunk: @escaping (String) -> Void,
                    onReasoning: @escaping (String) -> Void,
                    onDone: @escaping (String?) -> Void,
                    onError: @escaping (String) -> Void) {
        let url = URL(string: "\(baseURL)/api/chat/stream")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        
        var body: [String: Any] = ["modelId": modelId, "messages": messages]
        if let cid = conversationId { body["conversationId"] = cid }
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        let task = session.dataTask(with: request) { data, response, error in
            if let error = error { onError(error.localizedDescription); return }
            guard let data = data, let text = String(data: data, encoding: .utf8) else { onError("No data"); return }
            
            for line in text.components(separatedBy: "\n") {
                guard line.hasPrefix("data: ") else { continue }
                let data = String(line.dropFirst(6)).trimmingCharacters(in: .whitespaces)
                if data == "[DONE]" { onDone(nil); return }
                
                guard let jsonData = data.data(using: .utf8),
                      let json = try? JSONSerialization.jsonObject(with: jsonData) as? [String: Any],
                      let choices = json["choices"] as? [[String: Any]] else { continue }
                
                for choice in choices {
                    if let delta = choice["delta"] as? [String: Any] {
                        if let content = delta["content"] as? String { onChunk(content) }
                        if let reasoning = delta["reasoning"] as? String { onReasoning(reasoning) }
                    }
                }
            }
            onDone(nil)
        }
        task.resume()
    }
}

enum APIError: Error {
    case invalidResponse
    case serverError(String)
}

struct EmptyResponse: Decodable {}
