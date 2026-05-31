package com.aios.app.feature.prompts

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aios.app.core.network.ApiService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PromptItem(val id: String, val title: String, val content: String, val category: String = "")
data class PromptsUiState(val prompts: List<PromptItem> = emptyList(), val loading: Boolean = true)

@HiltViewModel
class PromptsViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _state = MutableStateFlow(PromptsUiState())
    val state: StateFlow<PromptsUiState> = _state.asStateFlow()
    init { load() }
    fun load() { viewModelScope.launch {
        _state.value = _state.value.copy(loading = true)
        try {
            val r = api.getPrompts(); val body = r.body() ?: emptyMap<String, Any>()
            val arr = body["prompts"] as? List<Map<String, Any>> ?: emptyList()
            val prompts = arr.map { m -> PromptItem(m["id"]?.toString() ?: "", m["title"]?.toString() ?: "", m["content"]?.toString() ?: "", m["category"]?.toString() ?: "") }
            _state.value = PromptsUiState(prompts = prompts)
        } catch (e: Exception) { _state.value = _state.value.copy(loading = false) }
    }}
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PromptsScreen(onBack: () -> Unit = {}, vm: PromptsViewModel = hiltViewModel()) {
    val s by vm.state.collectAsState()
    Scaffold(topBar = { TopAppBar(title = { Text("提示词库") }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "返回") } }, actions = { IconButton(onClick = { vm.load() }) { Icon(Icons.Default.Refresh, "刷新") } }) }) { pad ->
        if (s.loading) { Box(Modifier.fillMaxSize().padding(pad), androidx.compose.ui.Alignment.Center) { CircularProgressIndicator() } }
        else if (s.prompts.isEmpty()) { Box(Modifier.fillMaxSize().padding(pad), androidx.compose.ui.Alignment.Center) { Text("暂无提示词") } }
        else {
            LazyColumn(Modifier.fillMaxSize().padding(pad), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(s.prompts) { p ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(12.dp)) {
                            Text(p.title, style = MaterialTheme.typography.titleSmall)
                            if (p.category.isNotBlank()) Text(p.category, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                            Spacer(Modifier.height(4.dp))
                            Text(p.content, style = MaterialTheme.typography.bodySmall, maxLines = 3)
                        }
                    }
                }
            }
        }
    }
}
