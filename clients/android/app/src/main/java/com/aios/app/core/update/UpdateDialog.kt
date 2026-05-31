package com.aios.app.core.update

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun UpdateDialog(
    versionInfo: VersionInfo,
    downloading: Boolean,
    progress: Int,
    onDownload: () -> Unit,
    onDismiss: () -> Unit,
    forceUpdate: Boolean = false
) {
    AlertDialog(
        onDismissRequest = { if (!forceUpdate && !downloading) onDismiss() },
        title = {
            Text("发现新版本 v${versionInfo.versionName}", fontWeight = FontWeight.Bold)
        },
        text = {
            Column {
                if (versionInfo.releaseNotes.isNotBlank()) {
                    Text("更新内容:", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Spacer(Modifier.height(4.dp))
                    Text(versionInfo.releaseNotes, fontSize = 13.sp)
                    Spacer(Modifier.height(16.dp))
                }

                if (downloading) {
                    Text("正在下载...", fontSize = 13.sp)
                    Spacer(Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { progress / 100f },
                        modifier = Modifier.fillMaxWidth(),
                    )
                    Spacer(Modifier.height(4.dp))
                    Text("$progress%", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        },
        confirmButton = {
            if (!downloading) {
                Button(onClick = onDownload) {
                    Text("立即更新")
                }
            }
        },
        dismissButton = {
            if (!forceUpdate && !downloading) {
                TextButton(onClick = onDismiss) {
                    Text("稍后再说")
                }
            }
        }
    )
}
