package com.aios.app.feature.agent

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import com.aios.app.data.model.Agent
import com.aios.app.data.repository.AgentExecutionResult
import com.aios.app.data.repository.AgentRepository
import com.aios.app.feature.common.EmptyState
import com.aios.app.feature.common.LoadingIndicator
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AgentUiState(
    val agents: List<Agent> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val selectedAgent: Agent? = null,
    val executeInput: String = "",
    val executeResult: AgentExecutionResult? = null,
    val isExecuting: Boolean = false,
    val showExecuteDialog: Boolean = false
)

@HiltViewModel
class AgentViewModel @Inject constructor(
    private val agentRepo: AgentRepository
) : ViewModel() {
    private val _state = MutableStateFlow(AgentUiState())
    val state: StateFlow<AgentUiState> = _state.asStateFlow()

    init { loadAgents() }

    fun loadAgents() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            agentRepo.getAgents().onSuccess { agents ->
                _state.update { it.copy(agents = agents, isLoading = false) }
            }.onFailure { e ->
                _state.update { it.copy(error = e.message, isLoading = false) }
            }
        }
    }

    fun selectAgent(agent: Agent) { _state.update { it.copy(selectedAgent = agent, showExecuteDialog = true) } }
    fun updateInput(text: String) { _state.update { it.copy(executeInput = text) } }
    fun dismissDialog() { _state.update { it.copy(showExecuteDialog = false, executeResult = null, executeInput = "") } }

    fun executeAgent() {
        val agent = _state.value.selectedAgent ?: return
        val input = _state.value.executeInput.trim()
        if (input.isEmpty()) return

        _state.update { it.copy(isExecuting = true, executeResult = null) }
        viewModelScope.launch {
            agentRepo.executeAgent(agent.id, input, null).onSuccess { result ->
                _state.update { it.copy(isExecuting = false, executeResult = result) }
            }.onFailure { e ->
                _state.update { it.copy(isExecuting = false, error = e.message) }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentScreen(viewModel: AgentViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()

    Column(modifier = Modifier.fillMaxSize()) {
        TopAppBar(
            title = { Text("Agent", fontWeight = FontWeight.Bold) },
            actions = {
                IconButton(onClick = { viewModel.loadAgents() }) {
                    Icon(Icons.Default.Refresh, "刷新")
                }
            }
        )

        when {
            state.isLoading -> LoadingIndicator()
            state.agents.isEmpty() -> EmptyState(Icons.Default.SmartToy, "暂无 Agent", "还没有创建任何 Agent")
            else -> {
                LazyVerticalGrid(
                    columns = GridCells.Adaptive(280.dp),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(state.agents, key = { it.id }) { agent ->
                        AgentCard(agent = agent, onClick = { viewModel.selectAgent(agent) })
                    }
                }
            }
        }
    }

    // Execute dialog
    if (state.showExecuteDialog) {
        AlertDialog(
            onDismissRequest = { viewModel.dismissDialog() },
            title = { Text(state.selectedAgent?.name ?: "执行 Agent") },
            text = {
                Column {
                    OutlinedTextField(
                        value = state.executeInput,
                        onValueChange = { viewModel.updateInput(it) },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("输入指令...") },
                        maxLines = 5
                    )
                    if (state.isExecuting) {
                        Spacer(Modifier.height(16.dp))
                        LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                    }
                    state.executeResult?.let { result ->
                        Spacer(Modifier.height(16.dp))
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant
                        ) {
                            Text(
                                result.output ?: "无输出",
                                modifier = Modifier.padding(12.dp),
                                fontSize = 13.sp
                            )
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = { viewModel.executeAgent() },
                    enabled = !state.isExecuting && state.executeInput.isNotBlank()
                ) { Text("执行") }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.dismissDialog() }) { Text("关闭") }
            }
        )
    }
}

@Composable
fun AgentCard(agent: Agent, onClick: () -> Unit) {
    ElevatedCard(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.size(40.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(agent.name.firstOrNull()?.uppercase() ?: "A",
                             fontWeight = FontWeight.Bold,
                             color = MaterialTheme.colorScheme.onPrimaryContainer)
                    }
                }
                Spacer(Modifier.width(12.dp))
                Column {
                    Text(agent.name, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    Text("执行 ${agent.runCount} 次", fontSize = 12.sp,
                         color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }
    }
}
