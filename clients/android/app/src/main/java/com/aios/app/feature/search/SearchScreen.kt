package com.aios.app.feature.search

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.aios.app.feature.common.EmptyState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen() {
    Scaffold(
        topBar = { TopAppBar(title = { Text("搜索") }) }
    ) { padding ->
        EmptyState(
            icon = Icons.Default.Search,
            title = "搜索",
            subtitle = "功能开发中...",
            modifier = Modifier.padding(padding)
        )
    }
}
