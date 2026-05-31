package com.aios.app.feature.marketplace

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Storefront
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.aios.app.feature.common.EmptyState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MarketplaceScreen() {
    Scaffold(
        topBar = { TopAppBar(title = { Text("市场") }) }
    ) { padding ->
        EmptyState(
            icon = Icons.Default.Storefront,
            title = "市场",
            subtitle = "功能开发中...",
            modifier = Modifier.padding(padding)
        )
    }
}
