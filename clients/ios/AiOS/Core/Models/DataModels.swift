import Foundation

struct UserInfo: Codable {
    let id: String
    let numericAccount: String?
    let username: String
    let email: String?
    let role: String
    let displayName: String?
    let avatar: String?
    let balance: String?
}

struct AuthResponse: Codable {
    let success: Bool
    let user: UserInfo?
    let message: String?
}

struct AIModel: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let displayName: [String: String]?
    let type: String?
    let providerName: String?
    let providerStatus: String?
    let supportsVision: Bool?
    let supportsAudio: Bool?
    let contextWindow: Int?
    
    var displayTitle: String {
        displayName?["zh-CN"] ?? displayName?["en-US"] ?? name
    }
}

struct ModelsResponse: Codable {
    let models: [AIModel]
}

struct Conversation: Codable, Identifiable {
    let id: String
    let title: String
    let messageCount: Int
    let createdAt: String
    let updatedAt: String
}

struct ConversationsResponse: Codable {
    let conversations: [Conversation]
}

struct Agent: Codable, Identifiable {
    let id: String
    let name: String
    let description: [String: String]?
    let runCount: String?
    
    var displayDescription: String {
        description?["zh-CN"] ?? description?["en-US"] ?? ""
    }
}

struct AgentsResponse: Codable {
    let agents: [Agent]
}

struct AgentExecutionResult: Codable {
    let output: String?
    let status: String?
    let error: String?
}
