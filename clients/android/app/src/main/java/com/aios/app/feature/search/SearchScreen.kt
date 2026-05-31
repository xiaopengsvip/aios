package com.aios.app.feature.search

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.lifecycle.viewModelScope
import com.aios.app.core.network.ApiService
import com.aios.app.feature.common.EmptyState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SearchResult(val id: String, val title: String, val snippet: String, val type: String)

data class SearchState(
    val query: String = "",
    val isSearching: Boolean = false,
    val results: List<SearchResult> = emptyList(),
    val error: String? = null
)

@HiltViewModel
class SearchViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _state = MutableStateFlow(SearchState())
    val state: StateFlow<SearchState> = _state.asStateFlow()

    fun updateQuery(q: String) { _state.value = _state.value.copy(query = q) }

    fun search() {
        val q = _state.value.query
        if (q.isBlank()) return
        viewModelScope.launch {
            _state.value = _state.value.copy(isSearching = true, error = null)
            try {
                val resp = api.searchKnowledge(mapOf("query" to q))
                if (resp.isSuccessful) {
                    val body = resp.body() ?: emptyMap()
                    val items = (body["results"] as? List<*>)?.mapNotNull { item ->
                        val map = item as? Map<*, *> ?: return@mapNotNull null
                        SearchResult(
                            id = map["id"]?.toString() ?: "",
                            title = map["title"]?.toString() ?: map["name"]?.toString() ?: "",
                            snippet = map["snippet"]?.toString() ?: map["content"]?.toString()?.take(100) ?: "",
                            type = map["type"]?.toString() ?: "result"
                        )
                    } ?: emptyList()
                    _state.value = _state.value.copy(isSearching = false, results = items)
                } else {
                    _state.value = _state.value.copy(isSearching = false, error = "搜索失败")
                }
            } catch (e: Exception) {
                _state.value = _state.value.copy(isSearching = false, error = e.message)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen(viewModel: SearchViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text("搜索") }) }
    ) { padding ->
        Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            OutlinedTextField(
                value = state.query,
                onValueChange = { viewModel.updateQuery(it) },
                label = { Text("搜索知识库、对话、文件...") },
                leadingIcon = { Icon(Icons.Default.Search, null) },
                trailingIcon = {
                    if (state.query.isNotBlank()) {
                        IconButton(onClick = { viewModel.updateQuery(""); viewModel.search() }) {
                            Icon(Icons.Default.Clear, null)
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                singleLine = true,
                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(
                    imeAction = androidx.compose.ui.text.input.ImeAction.Search
                ),
                keyboardActions = androidx.compose.foundation.text.KeyboardActions(
                    onSearch = { viewModel.search() }
                )
            )

            Spacer(modifier = Modifier.height(8.dp))

            Button(
                onClick = { viewModel.search() },
                modifier = Modifier.fillMaxWidth(),
                enabled = state.query.isNotBlank() && !state.isSearching
            ) {
                if (state.isSearching) {
                    CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp)
                } else {
                    Text("搜索")
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            state.error?.let {
                Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
                Spacer(modifier = Modifier.height(8.dp))
            }

            if (state.results.isEmpty() && !state.isSearching) {
                EmptyState(icon = Icons.Default.Search, title = "全局搜索", subtitle = "输入关键词搜索知识库、对话和文件")
            } else {
                LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(state.results) { result ->
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        when (result.type) {
                                            "conversation" -> Icons.Default.Chat
                                            "file" -> Icons.Default.InsertDriveFile
                                            "knowledge" -> Icons.Default.MenuBook
                                            else -> Icons.Default.Article
                                        },
                                        null, modifier = Modifier.size(20.dp),
                                        tint = MaterialTheme.colorScheme.primary
                                    )
                                    Spacer(Modifier.width(8.dp))
                                    Text(result.title, fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                                }
                                if (result.snippet.isNotBlank()) {
                                    Spacer(Modifier.height(4.dp))
                                    Text(result.snippet, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 2)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
