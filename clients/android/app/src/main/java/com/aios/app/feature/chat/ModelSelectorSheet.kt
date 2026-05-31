package com.aios.app.feature.chat

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aios.app.data.model.AIModel

@Composable
fun ModelSelectorSheet(
    models: List<AIModel>,
    selectedModel: AIModel?,
    onSelect: (AIModel) -> Unit,
    onDismiss: () -> Unit
) {
    var search by remember { mutableStateOf("") }
    val filtered = models.filter {
        search.isBlank() ||
        it.name.contains(search, ignoreCase = true) ||
        it.getDisplayName().contains(search, ignoreCase = true)
    }

    // Group by provider
    val grouped = filtered.groupBy { it.providerName ?: "其他" }

    Surface(
        shape = RoundedCornerShape(bottomStart = 16.dp, bottomEnd = 16.dp),
        tonalElevation = 8.dp,
        modifier = Modifier.fillMaxWidth().heightIn(max = 400.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Search
            OutlinedTextField(
                value = search,
                onValueChange = { search = it },
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("搜索模型...") },
                leadingIcon = { Icon(Icons.Default.Search, null) },
                trailingIcon = {
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, "关闭")
                    }
                },
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            Spacer(Modifier.height(12.dp))

            LazyColumn {
                grouped.forEach { (provider, providerModels) ->
                    item {
                        Text(
                            provider,
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.padding(vertical = 8.dp)
                        )
                    }
                    items(providerModels, key = { it.id }) { model ->
                        ModelItem(
                            model = model,
                            isSelected = model.id == selectedModel?.id,
                            onClick = { onSelect(model) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ModelItem(model: AIModel, isSelected: Boolean, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(8.dp),
        color = if (isSelected) MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)
                else MaterialTheme.colorScheme.surface
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(model.getDisplayName(), fontWeight = FontWeight.Medium, fontSize = 14.sp)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (model.supportsVision) Text("👁", fontSize = 12.sp)
                    if (model.supportsAudio) Text("🎵", fontSize = 12.sp)
                    if (model.supportsToolUse) Text("🔧", fontSize = 12.sp)
                    Text("${model.contextWindow / 1000}K ctx", fontSize = 11.sp,
                         color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            if (isSelected) {
                Icon(Icons.Default.CheckCircle, null, tint = MaterialTheme.colorScheme.primary,
                     modifier = Modifier.size(20.dp))
            }
            // Status dot
            Box(
                modifier = Modifier.padding(start = 8.dp).size(8.dp)
            ) {
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = if (model.providerStatus == "online") MaterialTheme.colorScheme.tertiary
                            else MaterialTheme.colorScheme.outline
                ) {
                    Spacer(Modifier.fillMaxSize())
                }
            }
        }
    }
}
