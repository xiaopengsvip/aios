package com.aios.app.core.network

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import kotlinx.serialization.json.*
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.sse.*
import com.aios.app.data.model.*

/**
 * SSE Client for streaming chat responses.
 * Modular: supports both cookie-based and Bearer token auth.
 */
class SseClient(private val client: OkHttpClient, private val json: Json) {

    /**
     * Stream chat via AIOS backend /api/chat/stream
     * Uses OkHttp CookieJar for authentication.
     */
    fun streamChat(
        request: ChatRequest,
        onChunk: (String) -> Unit,
        onReasoning: (String) -> Unit,
        onDone: (String?) -> Unit,
        onError: (String) -> Unit
    ) {
        val baseUrl = com.aios.app.BuildConfig.API_BASE_URL.trimEnd('/')
        val jsonBody = json.encodeToString(ChatRequest.serializer(), request)

        val httpRequest = Request.Builder()
            .url("$baseUrl/api/chat/stream")
            .post(jsonBody.toRequestBody("application/json".toMediaType()))
            .header("Accept", "text/event-stream")
            .header("Cache-Control", "no-cache")
            .build()

        val factory = EventSources.createFactory(client)

        val listener = object : EventSourceListener() {
            override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
                if (data == "[DONE]") {
                    onDone(null)
                    eventSource.cancel()
                    return
                }
                try {
                    val chunk = json.decodeFromString<StreamChunk>(data)
                    // Check for error
                    chunk.error?.let { onError(it); eventSource.cancel(); return }
                    // Extract content from choices
                    chunk.choices?.forEach { choice ->
                        choice.delta?.content?.let { onChunk(it) }
                        choice.delta?.reasoning?.let { onReasoning(it) }
                    }
                } catch (e: Exception) {
                    // Skip malformed chunks
                }
            }

            override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
                val msg = when {
                    response?.code == 401 -> "登录已过期，请重新登录"
                    response?.code == 403 -> "没有权限执行此操作"
                    response?.code == 429 -> "请求过于频繁，请稍后重试"
                    response?.code != null && response.code >= 500 -> "服务器错误 (${response.code})"
                    t?.message?.contains("timeout", true) == true -> "请求超时，请检查网络"
                    t?.message?.contains("resolve", true) == true -> "DNS解析失败，请检查网络"
                    t?.message?.contains("connect", true) == true -> "连接服务器失败，请检查网络"
                    t != null -> "网络错误: ${t.message}"
                    else -> "连接失败 [${response?.code}]"
                }
                onError(msg)
            }

            override fun onClosed(eventSource: EventSource) {
                onDone(null)
            }
        }

        factory.newEventSource(httpRequest, listener)
    }

    /**
     * Stream via OpenAI-compatible API with Bearer token.
     */
    fun streamChatCompat(
        baseUrl: String,
        apiKey: String,
        model: String,
        messages: List<ChatMessage>,
        onChunk: (String) -> Unit,
        onDone: () -> Unit,
        onError: (String) -> Unit
    ) {
        val body = buildJsonObject {
            put("model", model)
            put("stream", true)
            putJsonArray("messages") {
                messages.forEach { msg ->
                    addJsonObject {
                        put("role", msg.role)
                        put("content", msg.content)
                    }
                }
            }
        }

        val request = Request.Builder()
            .url("${baseUrl.trimEnd('/')}/v1/chat/completions")
            .post(body.toString().toRequestBody("application/json".toMediaType()))
            .header("Authorization", "Bearer $apiKey")
            .header("Accept", "text/event-stream")
            .build()

        val factory = EventSources.createFactory(client)
        val listener = object : EventSourceListener() {
            override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
                if (data == "[DONE]") { onDone(); eventSource.cancel(); return }
                try {
                    val chunk = json.decodeFromString<StreamChunk>(data)
                    chunk.choices?.forEach { choice ->
                        choice.delta?.content?.let { onChunk(it) }
                    }
                } catch (_: Exception) {}
            }
            override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
                onError(t?.message ?: "SSE failed: ${response?.code}")
            }
            override fun onClosed(eventSource: EventSource) { onDone() }
        }

        factory.newEventSource(request, listener)
    }
}
