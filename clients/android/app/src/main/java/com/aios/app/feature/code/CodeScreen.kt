package com.aios.app.feature.code

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
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

data class CodeUiState(val code: String = "", val language: String = "python", val output: String? = null, val running: Boolean = false)

@HiltViewModel
class CodeViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _state = MutableStateFlow(CodeUiState())
    val state: StateFlow<CodeUiState> = _state.asStateFlow()
    fun updateCode(t: String) { _state.value = _state.value.copy(code = t) }
    fun updateLang(l: String) { _state.value = _state.value.copy(language = l) }
    fun run() { viewModelScope.launch {
        _state.value = _state.value.copy(running = true, output = null)
        try {
            val r = api.executeCode(mapOf("code" to _state.value.code, "language" to _state.value.language))
            _state.value = _state.value.copy(running = false, output = r.body()?.get("output")?.toString() ?: r.body()?.get("error")?.toString() ?: "无输出")
        } catch (e: Exception) { _state.value = _state.value.copy(running = false, output = "错误: ${e.message}") }
    }}
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CodeScreen(vm: CodeViewModel = hiltViewModel()) {
    val s by vm.state.collectAsState()
    Scaffold(topBar = { TopAppBar(title = { Text("代码执行") }) }) { pad ->
        Column(Modifier.fillMaxSize().padding(pad).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(s.code, { vm.updateCode(it) }, Modifier.fillMaxWidth().weight(1f), label = { Text("输入代码") }, textStyle = LocalTextStyle.current.copy(fontFamily = FontFamily.Monospace), minLines = 8)
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                AssistChip(onClick = { vm.updateLang("python") }, label = { Text("Python") }, leadingIcon = if (s.language == "python") {{ Icon(Icons.Default.Check, null, Modifier.size(16.dp)) }} else null)
                AssistChip(onClick = { vm.updateLang("javascript") }, label = { Text("JS") }, leadingIcon = if (s.language == "javascript") {{ Icon(Icons.Default.Check, null, Modifier.size(16.dp)) }} else null)
                Spacer(Modifier.weight(1f))
                Button(onClick = { vm.run() }, enabled = !s.running) { Text("运行") }
            }
            if (s.output != null) {
                Card(Modifier.fillMaxWidth().weight(1f)) {
                    Text(s.output!!, Modifier.padding(12.dp).verticalScroll(rememberScrollState()), fontFamily = FontFamily.Monospace)
                }
            }
        }
    }
}
