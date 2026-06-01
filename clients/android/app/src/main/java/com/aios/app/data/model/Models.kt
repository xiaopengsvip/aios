package com.aios.app.data.model

import kotlinx.serialization.*
import kotlinx.serialization.json.*

// ── Auth ──
@Serializable
data class LoginRequest(val email: String, val password: String)

@Serializable
data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String,
    val code: String,
    val displayName: String? = null
)

@Serializable
data class AuthResponse(
    val success: Boolean,
    val token: String? = null,
    val user: UserInfo? = null,
    val message: String? = null
)

@Serializable
data class UserInfo(
    val id: String,
    val numericAccount: String? = null,
    val username: String,
    val email: String? = null,
    val role: String = "USER",
    val displayName: String? = null,
    val avatar: String? = null,
    val locale: String = "zh-CN",
    val balance: String = "0"
)

// ── Models ──
@Serializable
data class AIModel(
    val id: String,
    val name: String,
    val displayName: JsonElement? = null,
    val type: String = "CHAT",
    val providerId: String,
    val providerName: String? = null,
    val providerStatus: String? = null,
    val supportsVision: Boolean = false,
    val supportsAudio: Boolean = false,
    val supportsVideo: Boolean = false,
    val supportsToolUse: Boolean = false,
    val contextWindow: Int = 128000,
    val maxTokens: Int = 4096,
    val inputPrice: String = "0",
    val outputPrice: String = "0"
) {
    fun getDisplayName(locale: String = "zh-CN"): String {
        if (displayName == null || displayName is JsonNull) return name
        return try {
            val obj = displayName.jsonObject
            obj[locale]?.jsonPrimitive?.content ?: obj["en-US"]?.jsonPrimitive?.content ?: name
        } catch (_: Exception) { name }
    }
}

// ── Conversations ──
@Serializable
data class Conversation(
    val id: String,
    val title: String = "新对话",
    val modelId: String? = null,
    val modelName: String? = null,
    val messageCount: Int = 0,
    val isArchived: Boolean = false,
    val isPinned: Boolean = false,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class Message(
    val id: String,
    val conversationId: String,
    val role: String,
    val content: String? = null,
    val contentJson: JsonElement? = null,
    val status: String = "COMPLETED",
    val modelName: String? = null,
    val providerName: String? = null,
    val promptTokens: Int = 0,
    val completionTokens: Int = 0,
    val createdAt: String
) {
    fun getTextContent(): String {
        if (!content.isNullOrBlank()) return content
        if (contentJson == null || contentJson is JsonNull) return ""
        return try {
            val arr = contentJson.jsonArray
            arr.firstOrNull { it.jsonObject["type"]?.jsonPrimitive?.content == "text" }
                ?.jsonObject?.get("text")?.jsonPrimitive?.content ?: "[附件]"
        } catch (_: Exception) { "" }
    }
}

// ── Chat ──
@Serializable
data class ChatRequest(
    val modelId: String,
    val messages: List<ChatMessage>,
    val conversationId: String? = null
)

@Serializable
data class ChatMessage(
    val role: String,
    val content: String
)

@Serializable
data class StreamChunk(
    val id: String? = null,
    val choices: List<StreamChoice>? = null,
    val error: String? = null
)

@Serializable
data class StreamChoice(
    val index: Int = 0,
    val delta: StreamDelta? = null,
    val finishReason: String? = null
)

@Serializable
data class StreamDelta(
    val content: String? = null,
    val reasoning: String? = null,
    val role: String? = null
)

// ── Agent ──
@Serializable
data class Agent(
    val id: String,
    val name: String,
    val description: JsonElement? = null,
    val avatar: String? = null,
    val systemPrompt: String,
    val modelId: String,
    val temperature: String? = null,
    val tools: JsonElement? = null,
    val isPublic: Boolean = false,
    val runCount: String = "0",
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class AgentExecuteRequest(
    val input: String,
    val modelId: String? = null
)

// ── Workflow ──
@Serializable
data class Workflow(
    val id: String,
    val name: String,
    val description: JsonElement? = null,
    val nodes: JsonElement? = null,
    val edges: JsonElement? = null,
    val isEnabled: Boolean = true,
    val isPublic: Boolean = false,
    val runCount: String = "0",
    val createdAt: String,
    val updatedAt: String
)

// ── Common ──
@Serializable
data class ApiResponse<T>(
    val success: Boolean? = null,
    val error: String? = null,
    val message: String? = null
)

@Serializable
data class PaginatedResponse<T>(
    val items: List<T> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val pageSize: Int = 20
)

@Serializable
data class CreditsBalance(
    val balance: String = "0",
    val creditLimit: String = "0",
    val totalSpent: String = "0"
)

@Serializable
data class UsageStats(
    val totalCalls: Long = 0,
    val totalTokens: Long = 0,
    val totalCost: String = "0",
    val byModel: List<ModelUsage> = emptyList()
)

@Serializable
data class ModelUsage(
    val modelName: String,
    val calls: Long = 0,
    val tokens: Long = 0,
    val cost: String = "0"
)
