package com.aios.app.feature.settings

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.aios.app.core.navigation.Screen
import com.aios.app.data.model.UserInfo
import com.aios.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val user: UserInfo? = null,
    val isLoading: Boolean = false
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val authRepo: AuthRepository
) : ViewModel() {
    private val _state = MutableStateFlow(SettingsUiState())
    val state: StateFlow<SettingsUiState> = _state.asStateFlow()

    init { loadUser() }

    fun loadUser() {
        viewModelScope.launch {
            authRepo.getMe().onSuccess { user -> _state.update { it.copy(user = user) } }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onLogout: () -> Unit,
    navController: NavController? = null,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var showLogoutDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(title = { Text("设置", fontWeight = FontWeight.Bold) })
        }
    ) { pad ->
    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(pad)
    ) {

        // Profile card
        state.user?.let { user ->
            ElevatedCard(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(
                    modifier = Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = CircleShape,
                        color = MaterialTheme.colorScheme.primaryContainer,
                        modifier = Modifier.size(56.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                user.displayName?.firstOrNull()?.uppercase()
                                    ?: user.username.firstOrNull()?.uppercase() ?: "?",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                    Spacer(Modifier.width(16.dp))
                    Column {
                        Text(user.displayName ?: user.username, fontWeight = FontWeight.SemiBold, fontSize = 18.sp)
                        user.email?.let { Text(it, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                        Text("AI: ${user.numericAccount ?: "-"}", fontSize = 12.sp,
                             color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
        }

        // Balance (clickable -> Credits)
        state.user?.let { user ->
            Card(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                shape = RoundedCornerShape(12.dp),
                onClick = { navController?.navigate(Screen.Credits.route) }
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.AccountBalanceWallet, null, tint = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.width(12.dp))
                    Text("余额", fontSize = 14.sp)
                    Spacer(Modifier.weight(1f))
                    Text("${user.balance} 积分", fontWeight = FontWeight.SemiBold,
                         color = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.width(8.dp))
                    Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.outline)
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // AI Tools section
        Text("AI 工具", style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), color = MaterialTheme.colorScheme.primary)
        SettingsMenuItem(Icons.Default.Image, "AI 绘图", "") { navController?.navigate(Screen.Image.route) }
        SettingsMenuItem(Icons.Default.Mic, "音频生成", "") { navController?.navigate(Screen.Audio.route) }
        SettingsMenuItem(Icons.Default.VideoCameraFront, "视频生成", "") { navController?.navigate(Screen.Video.route) }
        SettingsMenuItem(Icons.Default.Code, "代码执行", "") { navController?.navigate(Screen.Code.route) }
        SettingsMenuItem(Icons.Default.Search, "全局搜索", "") { navController?.navigate(Screen.Search.route) }

        Spacer(Modifier.height(12.dp))

        // Content section
        Text("内容管理", style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), color = MaterialTheme.colorScheme.primary)
        SettingsMenuItem(Icons.Default.MenuBook, "知识库", "") { navController?.navigate(Screen.Knowledge.route) }
        SettingsMenuItem(Icons.Default.Folder, "文件管理", "") { navController?.navigate(Screen.Files.route) }
        SettingsMenuItem(Icons.Default.Lightbulb, "提示词库", "") { navController?.navigate(Screen.Prompts.route) }
        SettingsMenuItem(Icons.Default.AccountTree, "工作流", "") { navController?.navigate(Screen.Workflow.route) }
        SettingsMenuItem(Icons.Default.Store, "应用市场", "") { navController?.navigate(Screen.Marketplace.route) }

        Spacer(Modifier.height(12.dp))

        // Account section
        Text("账户", style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), color = MaterialTheme.colorScheme.primary)
        SettingsMenuItem(Icons.Default.BarChart, "用量统计", "") { navController?.navigate(Screen.Usage.route) }
        SettingsMenuItem(Icons.Default.AccountBalanceWallet, "积分余额", "") { navController?.navigate(Screen.Credits.route) }
        SettingsMenuItem(Icons.Default.Api, "API 平台", "") { navController?.navigate(Screen.ApiPlatform.route) }

        Spacer(Modifier.height(12.dp))

        // System section
        Text("系统", style = MaterialTheme.typography.titleSmall, modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), color = MaterialTheme.colorScheme.primary)
        SettingsMenuItem(Icons.Default.DarkMode, "深色模式", "跟随系统") {}
        SettingsMenuItem(Icons.Default.Language, "语言", "简体中文") {}
        SettingsMenuItem(Icons.Default.SmartToy, "默认模型", "mimo-v2.5-pro") {}
        SettingsMenuItem(Icons.Default.Info, "关于", "v1.0.0") {}
        SettingsMenuItem(Icons.Default.Description, "使用条款", "") {}
        SettingsMenuItem(Icons.Default.Security, "隐私政策", "") {}

        Spacer(Modifier.height(24.dp))

        // Logout button
        Button(
            onClick = { showLogoutDialog = true },
            modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
        ) {
            Icon(Icons.Default.Logout, null)
            Spacer(Modifier.width(8.dp))
            Text("退出登录")
        }

        Spacer(Modifier.height(32.dp))
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("退出登录") },
            text = { Text("确定要退出登录吗？") },
            confirmButton = {
                Button(
                    onClick = { showLogoutDialog = false; onLogout() },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) { Text("确定") }
            },
            dismissButton = { TextButton(onClick = { showLogoutDialog = false }) { Text("取消") } }
        )
    }
}

@Composable
fun SettingsMenuItem(icon: androidx.compose.ui.graphics.vector.ImageVector, title: String, subtitle: String, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 2.dp),
        shape = RoundedCornerShape(8.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, null, tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(22.dp))
            Spacer(Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontSize = 15.sp)
                if (subtitle.isNotBlank()) {
                    Text(subtitle, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
            Icon(Icons.Default.ChevronRight, null, tint = MaterialTheme.colorScheme.outline)
        }
    }
}
