package com.aios.app.feature.files

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.aios.app.feature.common.EmptyState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilesScreen() {
    Scaffold(
        topBar = { TopAppBar(title = { Text("文件管理") }) }
    ) { padding ->
        EmptyState(
            icon = Icons.Default.Folder,
            title = "文件管理",
            subtitle = "功能开发中...",
            modifier = Modifier.padding(padding)
        )
    }
}
