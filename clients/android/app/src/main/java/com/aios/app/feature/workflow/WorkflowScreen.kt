package com.aios.app.feature.workflow

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aios.app.core.network.ApiService
import com.aios.app.data.model.Workflow
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class WorkflowUiState(val workflows: List<Workflow> = emptyList(), val loading: Boolean = true, val executing: String? = null)

@HiltViewModel
class WorkflowViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _state = MutableStateFlow(WorkflowUiState())
    val state: StateFlow<WorkflowUiState> = _state.asStateFlow()
    init { load() }
    fun load() { viewModelScope.launch {
        _state.value = _state.value.copy(loading = true)
        try {
            val r = api.getWorkflows(); val body = r.body() ?: emptyMap<String, Any>()
            val all = body.values.flatMap { v -> (v as? List<Map<String, Any>>)?.map { w ->
                Workflow(w["id"]?.toString() ?: "", w["name"]?.toString() ?: "", runCount = w["runCount"]?.toString() ?: "0", createdAt = w["createdAt"]?.toString() ?: "", updatedAt = w["updatedAt"]?.toString() ?: "")
            } ?: emptyList() }
            _state.value = WorkflowUiState(workflows = all)
        } catch (e: Exception) { _state.value = _state.value.copy(loading = false) }
    }}
    fun execute(id: String) { viewModelScope.launch {
        _state.value = _state.value.copy(executing = id)
        try { api.executeWorkflow(id, emptyMap()) } catch (_: Exception) {}
        _state.value = _state.value.copy(executing = null)
    }}
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkflowScreen(onBack: () -> Unit = {}, vm: WorkflowViewModel = hiltViewModel()) {
    val s by vm.state.collectAsState()
    Scaffold(topBar = { TopAppBar(title = { Text("工作流") }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "返回") } }, actions = { IconButton(onClick = { vm.load() }) { Icon(Icons.Default.Refresh, "刷新") } }) }) { pad ->
        if (s.loading) { Box(Modifier.fillMaxSize().padding(pad), Alignment.Center) { CircularProgressIndicator() } }
        else if (s.workflows.isEmpty()) { Box(Modifier.fillMaxSize().padding(pad), Alignment.Center) { Text("暂无工作流") } }
        else {
            LazyColumn(Modifier.fillMaxSize().padding(pad), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                items(s.workflows) { w ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(16.dp)) {
                            Text(w.name, style = MaterialTheme.typography.titleMedium)
                            Spacer(Modifier.height(4.dp))
                            Text("运行 ${w.runCount} 次", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(Modifier.height(8.dp))
                            Button(onClick = { vm.execute(w.id) }, enabled = s.executing != w.id) {
                                if (s.executing == w.id) CircularProgressIndicator(Modifier.size(16.dp), strokeWidth = 2.dp) else Text("执行")
                            }
                        }
                    }
                }
            }
        }
    }
}
