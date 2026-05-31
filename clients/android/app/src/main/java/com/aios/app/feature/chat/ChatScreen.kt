package com.aios.app.feature.chat

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.aios.app.data.model.Conversation
import com.aios.app.data.model.Message
import com.aios.app.feature.common.EmptyState
import com.aios.app.feature.common.LoadingIndicator

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(viewModel: ChatViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()

    Row(modifier = Modifier.fillMaxSize()) {
        // Conversation list - side panel on wide screens
        AnimatedVisibility(
            visible = state.showConversations,
            enter = slideInHorizontally { -it },
            exit = slideOutHorizontally { -it }
        ) {
            ConversationListPanel(
                conversations = state.conversations,
                currentId = state.currentConversationId,
                onSelect = { viewModel.selectConversation(it) },
                onNew = { viewModel.newConversation() },
                onDelete = { viewModel.deleteConversation(it) },
                onClose = { viewModel.toggleConversations() },
                modifier = Modifier.width(280.dp).fillMaxHeight()
            )
        }

        // Chat area
        Column(modifier = Modifier.weight(1f).fillMaxHeight()) {
            // Top bar
            TopAppBar(
                title = {
                    Text(
                        text = state.selectedModel?.getDisplayName() ?: "选择模型",
                        fontSize = 14.sp,
                        modifier = Modifier.clickable { viewModel.toggleModelSelector() }
                    )
                },
                navigationIcon = {
                    IconButton(onClick = { viewModel.toggleConversations() }) {
                        Icon(Icons.Default.Menu, "会话列表")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.newConversation() }) {
                        Icon(Icons.Default.Add, "新对话")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )

            // Model selector dropdown
            if (state.showModelSelector) {
                ModelSelectorSheet(
                    models = state.models,
                    selectedModel = state.selectedModel,
                    onSelect = { viewModel.selectModel(it) },
                    onDismiss = { viewModel.toggleModelSelector() }
                )
            }

            // Messages
            Box(modifier = Modifier.weight(1f)) {
                if (state.messages.isEmpty() && !state.isLoading) {
                    EmptyState(
                        icon = Icons.Default.Chat,
                        title = "开始对话",
                        subtitle = "选择一个模型，输入你的问题"
                    )
                } else if (state.isLoading) {
                    LoadingIndicator()
                } else {
                    MessageList(
                        messages = state.messages,
                        streamingContent = state.streamingContent,
                        streamingReasoning = state.streamingReasoning,
                        isStreaming = state.isStreaming
                    )
                }
            }

            // Error banner
            state.error?.let { error ->
                Surface(
                    color = MaterialTheme.colorScheme.errorContainer,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Warning, null, tint = MaterialTheme.colorScheme.error)
                        Spacer(Modifier.width(8.dp))
                        Text(error, color = MaterialTheme.colorScheme.onErrorContainer, modifier = Modifier.weight(1f))
                        IconButton(onClick = { viewModel.clearError() }) {
                            Icon(Icons.Default.Close, "关闭")
                        }
                    }
                }
            }

            // Input bar
            ChatInputBar(
                value = state.inputText,
                onValueChange = { viewModel.updateInput(it) },
                onSend = { viewModel.sendMessage() },
                isStreaming = state.isStreaming,
                enabled = state.selectedModel != null
            )
        }
    }
}

@Composable
fun ConversationListPanel(
    conversations: List<Conversation>,
    currentId: String?,
    onSelect: (String) -> Unit,
    onNew: () -> Unit,
    onDelete: (String) -> Unit,
    onClose: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Surface(modifier = modifier, color = MaterialTheme.colorScheme.surfaceVariant) {
        Column {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth().padding(8.dp, 12.dp, 8.dp, 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (onClose != null) {
                    IconButton(onClick = onClose) {
                        Icon(Icons.Default.ArrowBack, "返回")
                    }
                }
                Text("会话", fontWeight = FontWeight.Bold, fontSize = 18.sp, modifier = Modifier.weight(1f))
                FilledTonalButton(onClick = onNew) {
                    Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("新建")
                }
            }

            HorizontalDivider()

            if (conversations.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("暂无会话", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            } else {
                LazyColumn(modifier = Modifier.fillMaxSize()) {
                    items(conversations, key = { it.id }) { conv ->
                        ConversationItem(
                            conversation = conv,
                            isSelected = conv.id == currentId,
                            onClick = { onSelect(conv.id) },
                            onDelete = { onDelete(conv.id) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ConversationItem(
    conversation: Conversation,
    isSelected: Boolean,
    onClick: () -> Unit,
    onDelete: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        color = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                else MaterialTheme.colorScheme.surfaceVariant,
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.ChatBubbleOutline, null, modifier = Modifier.size(20.dp))
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    conversation.title,
                    maxLines = 1,
                    fontSize = 14.sp,
                    fontWeight = if (isSelected) FontWeight.SemiBold else FontWeight.Normal
                )
                Text(
                    "${conversation.messageCount} 条消息",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
fun MessageList(
    messages: List<Message>,
    streamingContent: String,
    streamingReasoning: String,
    isStreaming: Boolean
) {
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size, streamingContent) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.lastIndex)
        }
    }

    LazyColumn(
        state = listState,
        modifier = Modifier.fillMaxSize().padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        items(messages, key = { it.id }) { msg ->
            val isLast = msg.id == messages.lastOrNull()?.id
            val displayContent = if (isLast && isStreaming) streamingContent else msg.getTextContent()
            val displayReasoning = if (isLast && isStreaming) streamingReasoning else ""

            MessageBubble(
                role = msg.role,
                content = displayContent,
                reasoning = displayReasoning,
                isStreaming = isLast && isStreaming && displayContent.isEmpty(),
                modelName = msg.modelName
            )
        }
    }
}

@Composable
fun ChatInputBar(
    value: String,
    onValueChange: (String) -> Unit,
    onSend: () -> Unit,
    isStreaming: Boolean,
    enabled: Boolean
) {
    Surface(tonalElevation = 2.dp) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.Bottom
        ) {
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier.weight(1f),
                placeholder = { Text(if (enabled) "输入消息..." else "请先选择模型") },
                enabled = enabled && !isStreaming,
                maxLines = 5,
                shape = RoundedCornerShape(24.dp)
            )
            Spacer(Modifier.width(8.dp))
            FilledIconButton(
                onClick = onSend,
                enabled = enabled && !isStreaming && value.isNotBlank()
            ) {
                Icon(Icons.AutoMirrored.Filled.Send, "发送")
            }
        }
    }
}
