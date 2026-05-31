package com.aios.app.feature.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aios.app.data.model.*
import com.aios.app.data.repository.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ChatUiState(
    val conversations: List<Conversation> = emptyList(),
    val currentConversationId: String? = null,
    val messages: List<Message> = emptyList(),
    val models: List<AIModel> = emptyList(),
    val selectedModel: AIModel? = null,
    val inputText: String = "",
    val isLoading: Boolean = false,
    val isStreaming: Boolean = false,
    val streamingContent: String = "",
    val streamingReasoning: String = "",
    val error: String? = null,
    val showModelSelector: Boolean = false,
    val showConversations: Boolean = true
)

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepo: ChatRepository,
    private val authRepo: AuthRepository
) : ViewModel() {

    private val _state = MutableStateFlow(ChatUiState())
    val state: StateFlow<ChatUiState> = _state.asStateFlow()

    init {
        loadModels()
        loadConversations()
    }

    fun loadModels() {
        viewModelScope.launch {
            chatRepo.getModels().onSuccess { models ->
                _state.update { it.copy(
                    models = models,
                    selectedModel = it.selectedModel ?: models.firstOrNull { m -> m.name == "mimo-v2.5-pro" } ?: models.firstOrNull()
                )}
            }
        }
    }

    fun loadConversations() {
        viewModelScope.launch {
            chatRepo.getConversations().onSuccess { convs ->
                _state.update { it.copy(conversations = convs) }
            }
        }
    }

    fun selectConversation(id: String) {
        viewModelScope.launch {
            _state.update { it.copy(currentConversationId = id, isLoading = true, showConversations = false) }
            chatRepo.getConversation(id).onSuccess { detail ->
                _state.update { it.copy(messages = detail.messages, isLoading = false) }
            }.onFailure { e ->
                _state.update { it.copy(error = e.message, isLoading = false) }
            }
        }
    }

    fun selectModel(model: AIModel) {
        _state.update { it.copy(selectedModel = model, showModelSelector = false) }
    }

    fun updateInput(text: String) {
        _state.update { it.copy(inputText = text) }
    }

    fun toggleModelSelector() {
        _state.update { it.copy(showModelSelector = !it.showModelSelector) }
    }

    fun toggleConversations() {
        _state.update { it.copy(showConversations = !it.showConversations) }
    }

    fun newConversation() {
        _state.update { it.copy(currentConversationId = null, messages = emptyList(), showConversations = false) }
    }

    fun sendMessage() {
        val text = _state.value.inputText.trim()
        if (text.isEmpty() || _state.value.isStreaming) return
        val model = _state.value.selectedModel ?: return

        // Add user message to UI immediately
        val userMsg = Message(
            id = "temp-user-${System.currentTimeMillis()}",
            conversationId = _state.value.currentConversationId ?: "",
            role = "USER",
            content = text,
            createdAt = java.text.SimpleDateFormat("yyyy-MM-dd\'T\'HH:mm:ss", java.util.Locale.US).format(java.util.Date())
        )
        val assistantMsg = Message(
            id = "temp-assistant-${System.currentTimeMillis()}",
            conversationId = _state.value.currentConversationId ?: "",
            role = "ASSISTANT",
            content = "",
            createdAt = java.text.SimpleDateFormat("yyyy-MM-dd\'T\'HH:mm:ss", java.util.Locale.US).format(java.util.Date())
        )

        _state.update { it.copy(
            messages = it.messages + userMsg + assistantMsg,
            inputText = "",
            isStreaming = true,
            streamingContent = "",
            streamingReasoning = "",
            error = null
        )}

        val chatMessages = _state.value.messages.filter { it.role == "USER" || it.role == "ASSISTANT" }.map {
            ChatMessage(role = it.role.lowercase(), content = it.getTextContent())
        }

        viewModelScope.launch {
            chatRepo.streamChat(model.id, chatMessages, _state.value.currentConversationId)
                .collect { event ->
                    when (event) {
                        is StreamEvent.Content -> {
                            _state.update { it.copy(streamingContent = it.streamingContent + event.text) }
                        }
                        is StreamEvent.Reasoning -> {
                            _state.update { it.copy(streamingReasoning = it.streamingReasoning + event.text) }
                        }
                        is StreamEvent.Done -> {
                            val finalContent = _state.value.streamingContent
                            val finalReasoning = _state.value.streamingReasoning
                            _state.update { state ->
                                val updatedMessages = state.messages.toMutableList()
                                val lastIdx = updatedMessages.lastIndex
                                if (lastIdx >= 0) {
                                    updatedMessages[lastIdx] = updatedMessages[lastIdx].copy(content = finalContent)
                                }
                                state.copy(
                                    messages = updatedMessages,
                                    isStreaming = false,
                                    streamingContent = "",
                                    streamingReasoning = "",
                                    currentConversationId = event.conversationId ?: state.currentConversationId
                                )
                            }
                            loadConversations()
                        }
                        is StreamEvent.Error -> {
                            _state.update { it.copy(error = event.message, isStreaming = false) }
                        }
                    }
                }
        }
    }

    fun deleteConversation(id: String) {
        viewModelScope.launch {
            chatRepo.deleteConversation(id)
            loadConversations()
            if (_state.value.currentConversationId == id) {
                _state.update { it.copy(currentConversationId = null, messages = emptyList()) }
            }
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}
