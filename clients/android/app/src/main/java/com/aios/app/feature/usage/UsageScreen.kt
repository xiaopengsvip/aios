package com.aios.app.feature.usage

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
import com.aios.app.data.model.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class UsageUiState(val stats: UsageStats? = null, val loading: Boolean = true, val error: String? = null)

@HiltViewModel
class UsageViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _state = MutableStateFlow(UsageUiState())
    val state: StateFlow<UsageUiState> = _state.asStateFlow()
    init { load() }
    fun load() { viewModelScope.launch {
        _state.value = _state.value.copy(loading = true)
        try { val r = api.getUsageStats(); _state.value = UsageUiState(stats = r.body()) }
        catch (e: Exception) { _state.value = UsageUiState(error = e.message) }
    }}
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UsageScreen(onBack: () -> Unit = {}, vm: UsageViewModel = hiltViewModel()) {
    val s by vm.state.collectAsState()
    Scaffold(topBar = { TopAppBar(title = { Text("用量统计") }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "返回") } }, actions = { IconButton(onClick = { vm.load() }) { Icon(Icons.Default.Refresh, "刷新") } }) }) { pad ->
        if (s.loading) { Box(Modifier.fillMaxSize().padding(pad), Alignment.Center) { CircularProgressIndicator() } }
        else if (s.error != null) { Box(Modifier.fillMaxSize().padding(pad), Alignment.Center) { Text("错误: ${s.error}") } }
        else {
            val stats = s.stats!!
            LazyColumn(Modifier.fillMaxSize().padding(pad), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item { StatCard("总调用次数", "${stats.totalCalls}", Icons.Default.Call) }
                item { StatCard("总 Token 数", "${stats.totalTokens}", Icons.Default.Token) }
                item { StatCard("总花费", "¥${stats.totalCost}", Icons.Default.AttachMoney) }
                item { Text("按模型统计", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 8.dp)) }
                items(stats.byModel) { m ->
                    Card(Modifier.fillMaxWidth()) {
                        Column(Modifier.padding(12.dp)) {
                            Text(m.modelName, style = MaterialTheme.typography.bodyLarge)
                            Text("调用: ${m.calls} | Token: ${m.tokens} | 花费: ¥${m.cost}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatCard(title: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Card(Modifier.fillMaxWidth()) {
        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(40.dp))
            Spacer(Modifier.width(16.dp))
            Column { Text(title, style = MaterialTheme.typography.bodyMedium); Text(value, style = MaterialTheme.typography.headlineSmall) }
        }
    }
}
