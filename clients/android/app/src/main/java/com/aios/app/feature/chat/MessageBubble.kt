package com.aios.app.feature.chat

import android.widget.TextView
import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import io.noties.markwon.Markwon
import io.noties.markwon.ext.strikethrough.StrikethroughPlugin

@Composable
fun MessageBubble(
    role: String,
    content: String,
    reasoning: String = "",
    isStreaming: Boolean = false,
    modelName: String? = null
) {
    val isUser = role.uppercase() == "USER"
    val bgColor = if (isUser) MaterialTheme.colorScheme.primaryContainer
                  else MaterialTheme.colorScheme.surfaceVariant
    val textColor = if (isUser) MaterialTheme.colorScheme.onPrimaryContainer
                    else MaterialTheme.colorScheme.onSurfaceVariant

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
    ) {
        // Role label
        if (!isUser) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    Icons.Default.SmartToy, null,
                    modifier = Modifier.size(16.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
                modelName?.let {
                    Spacer(Modifier.width(4.dp))
                    Text(it, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Spacer(Modifier.height(4.dp))
        }

        // Reasoning section (collapsible)
        if (reasoning.isNotBlank()) {
            var expanded by remember { mutableStateOf(false) }
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = MaterialTheme.colorScheme.tertiaryContainer.copy(alpha = 0.5f),
                modifier = Modifier.widthIn(max = 320.dp)
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(Icons.Default.Psychology, null, modifier = Modifier.size(14.dp),
                             tint = MaterialTheme.colorScheme.tertiary)
                        Spacer(Modifier.width(4.dp))
                        Text("思考过程", fontSize = 12.sp,
                             color = MaterialTheme.colorScheme.onTertiaryContainer)
                        Spacer(Modifier.weight(1f))
                        IconButton(onClick = { expanded = !expanded }, modifier = Modifier.size(20.dp)) {
                            Icon(
                                if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                null, modifier = Modifier.size(16.dp)
                            )
                        }
                    }
                    AnimatedVisibility(visible = expanded) {
                        Text(
                            reasoning, fontSize = 13.sp, lineHeight = 18.sp,
                            color = MaterialTheme.colorScheme.onTertiaryContainer.copy(alpha = 0.8f),
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            }
            Spacer(Modifier.height(6.dp))
        }

        // Message content
        Surface(
            shape = RoundedCornerShape(
                topStart = if (isUser) 16.dp else 4.dp,
                topEnd = if (isUser) 4.dp else 16.dp,
                bottomStart = 16.dp,
                bottomEnd = 16.dp
            ),
            color = bgColor,
            modifier = Modifier.widthIn(max = 320.dp)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                if (content.isEmpty() && isStreaming) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                        Spacer(Modifier.width(8.dp))
                        Text("正在思考...", fontSize = 13.sp, color = textColor)
                    }
                } else if (isUser) {
                    Text(text = content, color = textColor, fontSize = 14.sp, lineHeight = 20.sp)
                } else {
                    MarkdownText(content)
                }
            }
        }

        // Streaming cursor
        if (isStreaming && content.isNotEmpty()) {
            Spacer(Modifier.height(2.dp))
            LinearProgressIndicator(
                modifier = Modifier.width(60.dp).height(2.dp).clip(RoundedCornerShape(1.dp)),
                trackColor = MaterialTheme.colorScheme.surfaceVariant
            )
        }
    }
}

@Composable
fun MarkdownText(markdown: String) {
    val context = LocalContext.current
    val markwon = remember {
        Markwon.builder(context)
            .usePlugin(StrikethroughPlugin.create())
            .build()
    }

    AndroidView(
        factory = { ctx ->
            TextView(ctx).apply {
                setTextColor(android.graphics.Color.parseColor("#E0E0E0"))
                textSize = 14f
                setLineSpacing(0f, 1.3f)
            }
        },
        update = { textView ->
            markwon.setMarkdown(textView, markdown)
        }
    )
}
