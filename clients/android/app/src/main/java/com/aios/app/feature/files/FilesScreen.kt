package com.aios.app.feature.files

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
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
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject

data class FileItem(val id: String, val name: String, val size: Long = 0, val type: String = "")
data class FilesUiState(val files: List<FileItem> = emptyList(), val loading: Boolean = true, val uploading: Boolean = false)

@HiltViewModel
class FilesViewModel @Inject constructor(private val api: ApiService) : ViewModel() {
    private val _state = MutableStateFlow(FilesUiState())
    val state: StateFlow<FilesUiState> = _state.asStateFlow()
    init { load() }
    fun load() { viewModelScope.launch {
        _state.value = _state.value.copy(loading = true)
        try {
            val r = api.getFiles(); val body = r.body() ?: emptyMap()
            val arr = body["files"] as? List<*> ?: emptyList()
            val files = arr.mapNotNull { item -> (item as? Map<*, *>)?.let { FileItem(it["id"]?.toString() ?: "", it["name"]?.toString() ?: "", (it["size"] as? Number)?.toLong() ?: 0, it["type"]?.toString() ?: "") } }
            _state.value = _state.value.copy(files = files, loading = false)
        } catch (e: Exception) { _state.value = _state.value.copy(loading = false) }
    }}
    fun upload(uri: Uri, context: android.content.Context) { viewModelScope.launch {
        _state.value = _state.value.copy(uploading = true)
        try {
            val bytes = context.contentResolver.openInputStream(uri)?.readBytes() ?: return@launch
            val body = bytes.toRequestBody("application/octet-stream".toMediaTypeOrNull())
            val part = MultipartBody.Part.createFormData("file", "upload", body)
            api.uploadFile(part)
            load()
        } catch (_: Exception) { _state.value = _state.value.copy(uploading = false) }
    }}
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilesScreen(vm: FilesViewModel = hiltViewModel()) {
    val s by vm.state.collectAsState()
    val ctx = LocalContext.current
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri -> uri?.let { vm.upload(it, ctx) } }
    Scaffold(topBar = { TopAppBar(title = { Text("文件管理") }, actions = {
        IconButton(onClick = { vm.load() }) { Icon(Icons.Default.Refresh, "刷新") }
        IconButton(onClick = { launcher.launch("*/*") }, enabled = !s.uploading) { Icon(Icons.Default.Upload, "上传") }
    }) }) { pad ->
        if (s.loading) { Box(Modifier.fillMaxSize().padding(pad), Alignment.Center) { CircularProgressIndicator() } }
        else if (s.files.isEmpty()) { Box(Modifier.fillMaxSize().padding(pad), Alignment.Center) { Text("暂无文件") } }
        else {
            LazyColumn(Modifier.fillMaxSize().padding(pad), contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(s.files) { f ->
                    Card(Modifier.fillMaxWidth()) {
                        Row(Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(when { f.type.startsWith("image") -> Icons.Default.Image; f.type.startsWith("video") -> Icons.Default.VideoFile; else -> Icons.Default.InsertDriveFile }, null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) { Text(f.name, style = MaterialTheme.typography.bodyLarge); Text("${f.size / 1024} KB", style = MaterialTheme.typography.bodySmall) }
                        }
                    }
                }
            }
        }
        if (s.uploading) { Box(Modifier.fillMaxSize(), Alignment.Center) { CircularProgressIndicator() } }
    }
}
