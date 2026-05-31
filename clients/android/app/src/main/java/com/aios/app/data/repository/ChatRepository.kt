package com.aios.app.data.repository

import com.aios.app.data.model.*
import com.aios.app.core.network.ApiService
import com.aios.app.core.network.SseClient
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Chat Repository - 对话/会话/SSE 流式
 */
@Singleton
class ChatRepository @Inject constructor(
    private val api: ApiService,
    private val sseClient: SseClient
) {
    // ── Models ──
    suspend fun getModels(): Result<List<AIModel>> = try {
        val resp = api.getModels()
        if (resp.isSuccessful) {
            Result.success(resp.body()?.models ?: emptyList())
        } else {
            Result.failure(Exception("获取模型失败"))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }

    // ── Conversations ──
    suspend fun getConversations(): Result<List<Conversation>> = try {
        val resp = api.getConversations()
        if (resp.isSuccessful) {
            Result.success(resp.body()?.conversations ?: emptyList())
        } else {
            Result.failure(Exception("获取会话失败"))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }

    suspend fun getConversation(id: String): Result<ConversationDetail> = try {
        val resp = api.getConversation(id)
        if (resp.isSuccessful && resp.body() != null) {
            Result.success(resp.body()!!)
        } else {
            Result.failure(Exception("获取会话详情失败"))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }

    suspend fun deleteConversation(id: String): Result<Unit> = try {
        api.deleteConversation(id)
        Result.success(Unit)
    } catch (e: Exception) {
        Result.failure(e)
    }

    // ── Streaming Chat ──
    fun streamChat(modelId: String, messages: List<ChatMessage>, conversationId: String?): Flow<StreamEvent> = callbackFlow {
        val request = ChatRequest(
            modelId = modelId,
            messages = messages,
            conversationId = conversationId
        )

        sseClient.streamChat(request,
            onChunk = { text ->
                trySend(StreamEvent.Content(text))
            },
            onReasoning = { text ->
                trySend(StreamEvent.Reasoning(text))
            },
            onDone = { convId ->
                trySend(StreamEvent.Done(convId))
                close()
            },
            onError = { error ->
                trySend(StreamEvent.Error(error))
                close()
            }
        )

        awaitClose { /* cleanup */ }
    }
}

// ── Stream Events ──
sealed class StreamEvent {
    data class Content(val text: String) : StreamEvent()
    data class Reasoning(val text: String) : StreamEvent()
    data class Done(val conversationId: String? = null) : StreamEvent()
    data class Error(val message: String) : StreamEvent()
}

// ── Extra response models ──
@kotlinx.serialization.Serializable
data class ModelsResponse(val models: List<AIModel> = emptyList())

@kotlinx.serialization.Serializable
data class ConversationsResponse(val conversations: List<Conversation> = emptyList())

@kotlinx.serialization.Serializable
data class ConversationDetail(
    val conversation: Conversation,
    val messages: List<Message> = emptyList()
)
