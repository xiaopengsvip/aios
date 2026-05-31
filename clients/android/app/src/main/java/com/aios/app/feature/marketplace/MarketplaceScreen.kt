package com.aios.app.feature.marketplace

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
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MarketItem(val id: String, val name: String, val description: String, val type: String, val price: String = "免费")
data class MarketUiState(val items: List<MarketItem> = emptyList(), val loading: Boolean = true, val type: String = "all")

@HiltViewModel
class MarketplaceViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _state = MutableStateFlow(MarketUiState())
    val state: StateFlow<MarketUiState> = _state.asStateFlow()
    init { load() }
    fun load(type: String = _state.value.type) { viewModelScope.launch {
        _state.value = _state.value.copy(loading = true, type = type)
        try {
            val r = api.getMarketplace(type = type); val body = r.body() ?: emptyMap()
            val arr = body["items"] as? List<*> ?: emptyList()
            val items = arr.mapNotNull { item -> (item as? Map<*, *>)?.let { MarketItem(it["id"]?.toString() ?: "", it["name"]?.toString() ?: "", it["description"]?.toString() ?: "", it["type"]?.toString() ?: "", it["price"]?.toString() ?: "免费") } }
            _state.value = _state.value.copy(items = items, loading = false)
        } catch (e: Exception) { _state.value = _state.value.copy(loading = false) }
    }}
    fun setType(t: String) { load(t) }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MarketplaceScreen(vm: MarketplaceViewModel = hiltViewModel()) {
    val s by vm.state.collectAsState()
    Scaffold(topBar = { TopAppBar(title = { Text("应用市场") }, actions = { IconButton(onClick = { vm.load() }) { Icon(Icons.Default.Refresh, "刷新") } }) }) { pad ->
        Column(Modifier.fillMaxSize().padding(pad)) {
            ScrollableTabRow(selectedTabIndex = listOf("all", "agent", "workflow", "prompt").indexOf(s.type).coerceAtLeast(0)) {
                Tab(s.type == "all", onClick = { vm.setType("all") }) { Text("全部", Modifier.padding(12.dp)) }
                Tab(s.type == "agent", onClick = { vm.setType("agent") }) { Text("智能体", Modifier.padding(12.dp)) }
                Tab(s.type == "workflow", onClick = { vm.setType("workflow") }) { Text("工作流", Modifier.padding(12.dp)) }
                Tab(s.type == "prompt", onClick = { vm.setType("prompt") }) { Text("提示词", Modifier.padding(12.dp)) }
            }
            if (s.loading) { Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() } }
            else if (s.items.isEmpty()) { Box(Modifier.fillMaxSize(), Alignment.Center) { Text("暂无应用") } }
            else {
                LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(s.items) { item ->
                        Card(Modifier.fillMaxWidth()) {
                            Column(Modifier.padding(16.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(when(item.type) { "agent" -> Icons.Default.SmartToy; "workflow" -> Icons.Default.AccountTree; else -> Icons.Default.Lightbulb }, null, tint = MaterialTheme.colorScheme.primary)
                                    Spacer(Modifier.width(8.dp))
                                    Text(item.name, style = MaterialTheme.typography.titleMedium)
                                }
                                Spacer(Modifier.height(4.dp))
                                Text(item.description, style = MaterialTheme.typography.bodySmall, maxLines = 2)
                                Spacer(Modifier.height(8.dp))
                                Text(item.price, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.primary)
                            }
                        }
                    }
                }
            }
        }
    }
}
