package com.aios.app.feature.knowledge

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
import kotlinx.serialization.json.*
import javax.inject.Inject

data class Kb(val id: String, val name: String, val docCount: Int = 0)

data class KnowledgeUiState(val bases: List<Kb> = emptyList(), val query: String = "", val results: List<String> = emptyList(), val loading: Boolean = true, val searching: Boolean = false)

@HiltViewModel
class KnowledgeViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _state = MutableStateFlow(KnowledgeUiState())
    val state: StateFlow<KnowledgeUiState> = _state.asStateFlow()
    init { load() }
    fun load() { viewModelScope.launch {
        _state.value = _state.value.copy(loading = true)
        try {
            val r = api.getKnowledgeBases()
            val body = r.body() ?: emptyMap()
            val arr = body["bases"] as? List<*> ?: body["knowledgeBases"] as? List<*> ?: emptyList()
            val bases = arr.mapNotNull { it as? Map<*, *> }.map { Kb(it["id"]?.toString() ?: "", it["name"]?.toString() ?: "", (it["docCount"] as? Number)?.toInt() ?: 0) }
            _state.value = _state.value.copy(bases = bases, loading = false)
        } catch (e: Exception) { _state.value = _state.value.copy(loading = false) }
    }}
    fun updateQuery(q: String) { _state.value = _state.value.copy(query = q) }
    fun search() { viewModelScope.launch {
        _state.value = _state.value.copy(searching = true)
        try {
            val r = api.searchKnowledge(mapOf("query" to _state.value.query))
            val body = r.body() ?: emptyMap()
            val results = (body["results"] as? List<*>)?.map { it.toString() } ?: emptyList()
            _state.value = _state.value.copy(results = results, searching = false)
        } catch (e: Exception) { _state.value = _state.value.copy(searching = false) }
    }}
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun KnowledgeScreen(vm: KnowledgeViewModel = hiltViewModel()) {
    val s by vm.state.collectAsState()
    Scaffold(topBar = { TopAppBar(title = { Text("知识库") }, actions = { IconButton(onClick = { vm.load() }) { Icon(Icons.Default.Refresh, "刷新") } }) }) { pad ->
        if (s.loading) { Box(Modifier.fillMaxSize().padding(pad), Alignment.Center) { CircularProgressIndicator() } }
        else {
            LazyColumn(Modifier.fillMaxSize().padding(pad), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item {
                    OutlinedTextField(s.query, { vm.updateQuery(it) }, Modifier.fillMaxWidth(), label = { Text("搜索知识库") }, trailingIcon = {
                        IconButton(onClick = { vm.search() }, enabled = !s.searching) { Icon(Icons.Default.Search, "搜索") }
                    })
                }
                if (s.results.isNotEmpty()) {
                    item { Text("搜索结果", style = MaterialTheme.typography.titleMedium) }
                    items(s.results) { r -> Card(Modifier.fillMaxWidth()) { Text(r, Modifier.padding(12.dp)) } }
                }
                item { Text("知识库列表", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 8.dp)) }
                items(s.bases) { kb ->
                    Card(Modifier.fillMaxWidth()) {
                        Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.MenuBook, null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(Modifier.width(12.dp))
                            Column { Text(kb.name, style = MaterialTheme.typography.bodyLarge); Text("${kb.docCount} 篇文档", style = MaterialTheme.typography.bodySmall) }
                        }
                    }
                }
            }
        }
    }
}
