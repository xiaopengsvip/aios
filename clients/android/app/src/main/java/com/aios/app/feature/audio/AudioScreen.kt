package com.aios.app.feature.audio

import androidx.compose.foundation.layout.*
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

data class AudioUiState(val prompt: String = "", val url: String? = null, val generating: Boolean = false, val error: String? = null)

@HiltViewModel
class AudioViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _state = MutableStateFlow(AudioUiState())
    val state: StateFlow<AudioUiState> = _state.asStateFlow()
    fun updatePrompt(t: String) { _state.value = _state.value.copy(prompt = t) }
    fun generate() { viewModelScope.launch {
        _state.value = _state.value.copy(generating = true, error = null)
        try {
            val r = api.generateAudio(mapOf("prompt" to _state.value.prompt))
            if (r.isSuccessful) { _state.value = _state.value.copy(generating = false, url = r.body()?.get("url")?.toString()) }
            else _state.value = _state.value.copy(generating = false, error = "生成失败")
        } catch (e: Exception) { _state.value = _state.value.copy(generating = false, error = e.message) }
    }}
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AudioScreen(vm: AudioViewModel = hiltViewModel()) {
    val s by vm.state.collectAsState()
    Scaffold(topBar = { TopAppBar(title = { Text("音频生成") }) }) { pad ->
        Column(Modifier.fillMaxSize().padding(pad).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            OutlinedTextField(s.prompt, { vm.updatePrompt(it) }, Modifier.fillMaxWidth(), label = { Text("描述你想生成的音频") }, minLines = 3)
            Button(onClick = { vm.generate() }, enabled = !s.generating && s.prompt.isNotBlank(), modifier = Modifier.fillMaxWidth()) {
                if (s.generating) CircularProgressIndicator(Modifier.size(20.dp), strokeWidth = 2.dp) else Text("生成音频")
            }
            if (s.url != null) { Card(Modifier.fillMaxWidth()) { Text("生成完成！", Modifier.padding(16.dp)) } }
            if (s.error != null) { Text("错误: ${s.error}", color = MaterialTheme.colorScheme.error) }
        }
    }
}
