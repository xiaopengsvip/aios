package com.aios.app.feature.credits

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.aios.app.feature.common.EmptyState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreditsScreen() {
    Scaffold(
        topBar = { TopAppBar(title = { Text("积分") }) }
    ) { padding ->
        EmptyState(
            icon = Icons.Default.AccountBalanceWallet,
            title = "积分",
            subtitle = "功能开发中...",
            modifier = Modifier.padding(padding)
        )
    }
}
