package com.aios.app.feature.image

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import coil.compose.AsyncImage
import com.aios.app.core.network.ApiService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ImageGenState(
    val prompt: String = "",
    val isGenerating: Boolean = false,
    val generatedUrls: List<String> = emptyList(),
    val error: String? = null,
    val selectedStyle: String = "realistic"
)

@HiltViewModel
class ImageViewModel @Inject constructor(
    private val api: ApiService
) : ViewModel() {
    private val _state = MutableStateFlow(ImageGenState())
    val state: StateFlow<ImageGenState> = _state.asStateFlow()

    fun updatePrompt(text: String) { _state.value = _state.value.copy(prompt = text) }
    fun setStyle(style: String) { _state.value = _state.value.copy(selectedStyle = style) }
    fun clearError() { _state.value = _state.value.copy(error = null) }

    fun generate() {
        val prompt = _state.value.prompt
        if (prompt.isBlank()) return
        viewModelScope.launch {
            _state.value = _state.value.copy(isGenerating = true, error = null)
            try {
                val resp = api.generateImage(mapOf(
                    "prompt" to prompt,
                    "style" to _state.value.selectedStyle,
                    "size" to "1024x1024"
                ))
                if (resp.isSuccessful) {
                    val body = resp.body() ?: emptyMap()
                    val urls = (body["urls"] as? List<*>)?.mapNotNull { it as? String }
                        ?: (body["url"] as? String)?.let { listOf(it) }
                        ?: emptyList()
                    _state.value = _state.value.copy(
                        isGenerating = false,
                        generatedUrls = urls + _state.value.generatedUrls
                    )
                } else {
                    _state.value = _state.value.copy(isGenerating = false, error = "生成失败: ${resp.code()}")
                }
            } catch (e: Exception) {
                _state.value = _state.value.copy(isGenerating = false, error = e.message ?: "网络错误")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ImageScreen(viewModel: ImageViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    val styles = listOf("realistic" to "写实", "anime" to "动漫", "oil" to "油画", "watercolor" to "水彩", "sketch" to "素描")

    Scaffold(
        topBar = { TopAppBar(title = { Text("AI 绘图") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Prompt input
            OutlinedTextField(
                value = state.prompt,
                onValueChange = { viewModel.updatePrompt(it) },
                label = { Text("描述你想要的图片") },
                placeholder = { Text("例如：一只在月光下奔跑的猫") },
                modifier = Modifier.fillMaxWidth(),
                maxLines = 3,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Style selector
            Text("风格", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(4.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(styles) { (key, label) ->
                    FilterChip(
                        selected = state.selectedStyle == key,
                        onClick = { viewModel.setStyle(key) },
                        label = { Text(label) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Generate button
            Button(
                onClick = { viewModel.generate() },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                enabled = !state.isGenerating && state.prompt.isNotBlank()
            ) {
                if (state.isGenerating) {
                    CircularProgressIndicator(Modifier.size(24.dp), strokeWidth = 2.dp, color = MaterialTheme.colorScheme.onPrimary)
                    Spacer(Modifier.width(8.dp))
                    Text("生成中...")
                } else {
                    Icon(Icons.Default.Brush, null)
                    Spacer(Modifier.width(8.dp))
                    Text("生成图片", fontSize = 16.sp)
                }
            }

            // Error
            state.error?.let {
                Spacer(Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
            }

            // Generated images
            if (state.generatedUrls.isNotEmpty()) {
                Spacer(Modifier.height(16.dp))
                Text("生成结果", fontSize = 16.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(8.dp))
                state.generatedUrls.forEach { url ->
                    AsyncImage(
                        model = url,
                        contentDescription = null,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp)),
                        contentScale = ContentScale.FillWidth
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                }
            }
        }
    }
}
