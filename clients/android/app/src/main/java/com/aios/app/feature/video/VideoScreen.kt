package com.aios.app.feature.video

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.aios.app.feature.common.EmptyState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VideoScreen(onBack: () -> Unit = {}) {
    Scaffold(topBar = { TopAppBar(title = { Text("视频生成") }, navigationIcon = { IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, "返回") } }) }) { pad ->
        EmptyState(icon = Icons.Default.VideoCameraFront, title = "视频生成", subtitle = "使用 AI 生成视频内容，功能即将上线", modifier = Modifier.padding(pad))
    }
}
