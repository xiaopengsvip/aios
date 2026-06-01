package com.aios.app.feature.video

import android.net.Uri
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
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import coil.compose.AsyncImage
import com.aios.app.core.network.ApiService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class VideoGenState(
    val prompt: String = "",
    val isGenerating: Boolean = false,
    val generatedVideos: List<VideoResult> = emptyList(),
    val error: String? = null,
    val selectedDuration: String = "5s",
    val selectedResolution: String = "720p",
    val selectedAspectRatio: String = "16:9"
)

data class VideoResult(
    val url: String,
    val taskId: String? = null,
    val status: String = "completed"
)

@HiltViewModel
class VideoViewModel @Inject constructor(
    private val api: ApiService
) : ViewModel() {
    private val _state = MutableStateFlow(VideoGenState())
    val state: StateFlow<VideoGenState> = _state.asStateFlow()

    fun updatePrompt(text: String) { _state.value = _state.value.copy(prompt = text) }
    fun setDuration(d: String) { _state.value = _state.value.copy(selectedDuration = d) }
    fun setResolution(r: String) { _state.value = _state.value.copy(selectedResolution = r) }
    fun setAspectRatio(r: String) { _state.value = _state.value.copy(selectedAspectRatio = r) }
    fun clearError() { _state.value = _state.value.copy(error = null) }

    fun generate() {
        val prompt = _state.value.prompt
        if (prompt.isBlank()) return
        viewModelScope.launch {
            _state.value = _state.value.copy(isGenerating = true, error = null)
            try {
                val resp = api.generateVideo(mapOf(
                    "prompt" to prompt,
                    "duration" to _state.value.selectedDuration,
                    "resolution" to _state.value.selectedResolution,
                    "aspectRatio" to _state.value.selectedAspectRatio
                ))
                if (resp.isSuccessful) {
                    val body = resp.body() ?: emptyMap()
                    val video = body["video"] as? Map<*, *>
                    val url = video?.get("url") as? String ?: ""
                    val taskId = video?.get("taskId") as? String
                    if (url.isNotBlank()) {
                        _state.value = _state.value.copy(
                            isGenerating = false,
                            generatedVideos = listOf(VideoResult(url, taskId)) + _state.value.generatedVideos
                        )
                    } else {
                        _state.value = _state.value.copy(isGenerating = false, error = "视频生成失败: 无返回URL")
                    }
                } else {
                    val errBody = resp.errorBody()?.string() ?: ""
                    val msg = try { org.json.JSONObject(errBody).optString("error", "生成失败") } catch (_: Exception) { "生成失败: ${resp.code()}" }
                    _state.value = _state.value.copy(isGenerating = false, error = msg)
                }
            } catch (e: Exception) {
                _state.value = _state.value.copy(isGenerating = false, error = e.message ?: "网络错误")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VideoScreen(onBack: () -> Unit = {}, viewModel: VideoViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsState()
    val durations = listOf("3s" to "3秒", "5s" to "5秒", "10s" to "10秒")
    val resolutions = listOf("480p" to "480p", "720p" to "720p", "1080p" to "1080p")
    val aspectRatios = listOf("16:9" to "横屏", "9:16" to "竖屏", "1:1" to "方形")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("视频生成") },
                navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.Default.ArrowBack, "返回") } }
            )
        }
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
                label = { Text("描述你想要的视频") },
                placeholder = { Text("例如：一只猫在草地上奔跑，慢动作") },
                modifier = Modifier.fillMaxWidth(),
                maxLines = 4,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Duration
            Text("时长", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(4.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(durations) { (key, label) ->
                    FilterChip(
                        selected = state.selectedDuration == key,
                        onClick = { viewModel.setDuration(key) },
                        label = { Text(label) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Resolution
            Text("分辨率", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(4.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(resolutions) { (key, label) ->
                    FilterChip(
                        selected = state.selectedResolution == key,
                        onClick = { viewModel.setResolution(key) },
                        label = { Text(label) }
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Aspect Ratio
            Text("比例", fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Spacer(modifier = Modifier.height(4.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(aspectRatios) { (key, label) ->
                    FilterChip(
                        selected = state.selectedAspectRatio == key,
                        onClick = { viewModel.setAspectRatio(key) },
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
                    Text("生成中... (可能需要1-3分钟)")
                } else {
                    Icon(Icons.Default.VideoCameraFront, null)
                    Spacer(Modifier.width(8.dp))
                    Text("生成视频", fontSize = 16.sp)
                }
            }

            // Error
            state.error?.let {
                Spacer(modifier = Modifier.height(8.dp))
                Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
            }

            // Generated videos
            if (state.generatedVideos.isNotEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))
                Text("生成结果", fontSize = 16.sp, fontWeight = androidx.compose.ui.text.font.FontWeight.SemiBold)
                Spacer(modifier = Modifier.height(8.dp))
                state.generatedVideos.forEach { video ->
                    VideoPlayerCard(videoUrl = video.url)
                    Spacer(modifier = Modifier.height(12.dp))
                }
            }
        }
    }
}

@Composable
fun VideoPlayerCard(videoUrl: String) {
    val context = LocalContext.current
    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(Uri.parse(videoUrl)))
            prepare()
        }
    }

    DisposableEffect(Unit) {
        onDispose { exoPlayer.release() }
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    player = exoPlayer
                    useController = true
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(16f / 9f)
                .clip(RoundedCornerShape(12.dp))
        )
    }
}
