package com.aios.app.feature.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.material3.ripple
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
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

// ── Design tokens ──
private val BgGray = Color(0xFFF6F7FB)
private val CardWhite = Color(0xFFFFFFFF)
private val TextPrimary = Color(0xFF1F2329)
private val TextSecondary = Color(0xFF8A8F98)
private val ArrowGray = Color(0xFFC4C7CC)
private val DividerColor = Color(0xFFEEF0F4)
private val BrandBlue = Color(0xFF3B82F6)
private val RippleBg = Color(0xFFF2F4F8)

// ── ViewModel ──
data class SettingsUiState(val user: UserInfo? = null, val isLoading: Boolean = false)

@HiltViewModel
class SettingsViewModel @Inject constructor(private val authRepo: AuthRepository) : ViewModel() {
    private val _state = MutableStateFlow(SettingsUiState())
    val state: StateFlow<SettingsUiState> = _state.asStateFlow()
    init { loadUser() }
    fun loadUser() {
        viewModelScope.launch {
            authRepo.getMe().onSuccess { u -> _state.update { it.copy(user = u) } }
        }
    }
}

// ── Main Screen ──
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onLogout: () -> Unit,
    onCheckUpdate: (() -> Unit)? = null,
    navController: NavController? = null,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var showLogoutDialog by remember { mutableStateOf(false) }
    val context = androidx.compose.ui.platform.LocalContext.current
    val appVersion = remember {
        try { context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "0.0.5" }
        catch (_: Exception) { "0.0.5" }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgGray)
    ) {
        // ── Header ──
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .statusBarsPadding()
                .padding(top = 12.dp, bottom = 8.dp),
            contentAlignment = Alignment.Center
        ) {
            Text("设置", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = TextPrimary)
        }

        // ── Scrollable content ──
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
        ) {
            // ── Profile Card ──
            state.user?.let { user ->
                Spacer(Modifier.height(8.dp))
                CardGroup {
                    ProfileItem(user) { /* could navigate to profile edit */ }
                }
            }

            // ── Balance ──
            state.user?.let { user ->
                Spacer(Modifier.height(16.dp))
                CardGroup {
                    SettingsItem(
                        icon = Icons.Default.AccountBalanceWallet,
                        title = "积分余额",
                        subtitle = "${user.balance} 积分",
                        subtitleColor = BrandBlue,
                        onClick = { navController?.navigate(Screen.Credits.route) }
                    )
                }
            }

            // ── AI 工具 ──
            Spacer(Modifier.height(24.dp))
            SectionHeader("AI 工具")
            Spacer(Modifier.height(8.dp))
            CardGroup {
                SettingsItem(Icons.Default.Image, "AI 绘图") { navController?.navigate(Screen.Image.route) }
                SettingsDivider()
                SettingsItem(Icons.Default.Mic, "音频生成") { navController?.navigate(Screen.Audio.route) }
                SettingsDivider()
                SettingsItem(Icons.Default.VideoCameraFront, "视频生成") { navController?.navigate(Screen.Video.route) }
                SettingsDivider()
                SettingsItem(Icons.Default.Code, "代码执行") { navController?.navigate(Screen.Code.route) }
                SettingsDivider()
                SettingsItem(Icons.Default.Search, "全局搜索") { navController?.navigate(Screen.Search.route) }
            }

            // ── 内容管理 ──
            Spacer(Modifier.height(24.dp))
            SectionHeader("内容管理")
            Spacer(Modifier.height(8.dp))
            CardGroup {
                SettingsItem(Icons.Default.MenuBook, "知识库") { navController?.navigate(Screen.Knowledge.route) }
                SettingsDivider()
                SettingsItem(Icons.Default.Folder, "文件管理") { navController?.navigate(Screen.Files.route) }
                SettingsDivider()
                SettingsItem(Icons.Default.Lightbulb, "提示词库") { navController?.navigate(Screen.Prompts.route) }
                SettingsDivider()
                SettingsItem(Icons.Default.AccountTree, "工作流") { navController?.navigate(Screen.Workflow.route) }
                SettingsDivider()
                SettingsItem(Icons.Default.Store, "应用市场") { navController?.navigate(Screen.Marketplace.route) }
            }

            // ── 账户 ──
            Spacer(Modifier.height(24.dp))
            SectionHeader("账户")
            Spacer(Modifier.height(8.dp))
            CardGroup {
                SettingsItem(Icons.Default.BarChart, "用量统计") { navController?.navigate(Screen.Usage.route) }
                SettingsDivider()
                SettingsItem(Icons.Default.AccountBalanceWallet, "积分余额") { navController?.navigate(Screen.Credits.route) }
                SettingsDivider()
                SettingsItem(Icons.Default.Api, "API 平台") { navController?.navigate(Screen.ApiPlatform.route) }
            }

            // ── 系统 ──
            Spacer(Modifier.height(24.dp))
            SectionHeader("系统")
            Spacer(Modifier.height(8.dp))
            CardGroup {
                SettingsItem(Icons.Default.DarkMode, "深色模式", subtitle = "跟随系统") {}
                SettingsDivider()
                SettingsItem(Icons.Default.Language, "语言", subtitle = "简体中文") {}
                SettingsDivider()
                SettingsItem(Icons.Default.SmartToy, "默认模型", subtitle = "mimo-v2.5-pro") {}
                SettingsDivider()
                SettingsItem(Icons.Default.Info, "关于", subtitle = "v$appVersion") {}
                SettingsDivider()
                SettingsItem(Icons.Default.Update, "检查更新", subtitle = "v$appVersion") { onCheckUpdate?.invoke() }
            }

            // ── 法律 ──
            Spacer(Modifier.height(24.dp))
            CardGroup {
                SettingsItem(Icons.Default.Description, "使用条款") {}
                SettingsDivider()
                SettingsItem(Icons.Default.Security, "隐私政策") {}
            }

            // ── 退出登录 ──
            Spacer(Modifier.height(24.dp))
            CardGroup {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { showLogoutDialog = true }
                        .padding(horizontal = 16.dp, vertical = 16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("退出登录", fontSize = 15.sp, fontWeight = FontWeight.Medium, color = MaterialTheme.colorScheme.error)
                }
            }

            Spacer(Modifier.height(32.dp))
        }
    }

    // ── Logout dialog ──
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

// ── Components ──

@Composable
private fun CardGroup(content: @Composable ColumnScope.() -> Unit) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = CardWhite,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(content = content)
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        title,
        fontSize = 13.sp,
        fontWeight = FontWeight.Normal,
        color = TextSecondary,
        modifier = Modifier.padding(start = 4.dp)
    )
}

@Composable
private fun ProfileItem(user: UserInfo, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Avatar
        Surface(
            shape = CircleShape,
            color = MaterialTheme.colorScheme.primaryContainer,
            modifier = Modifier.size(48.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    user.displayName?.firstOrNull()?.uppercase()
                        ?: user.username.firstOrNull()?.uppercase() ?: "?",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
            }
        }
        Spacer(Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                user.displayName ?: user.username,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(Modifier.height(2.dp))
            Text(
                user.email ?: "AI: ${user.numericAccount ?: "-"}",
                fontSize = 13.sp,
                color = TextSecondary,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
        Icon(Icons.Default.ChevronRight, null, tint = ArrowGray, modifier = Modifier.size(20.dp))
    }
}

@Composable
fun SettingsItem(
    icon: ImageVector,
    title: String,
    subtitle: String = "",
    subtitleColor: Color = TextSecondary,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp)
            .clickable(
                onClick = onClick,
                indication = ripple(color = RippleBg),
                interactionSource = remember { MutableInteractionSource() }
            )
            .padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = TextSecondary, modifier = Modifier.size(22.dp))
        Spacer(Modifier.width(12.dp))
        Text(title, fontSize = 15.sp, fontWeight = FontWeight.Medium, color = TextPrimary, modifier = Modifier.weight(1f))
        if (subtitle.isNotBlank()) {
            Text(subtitle, fontSize = 13.sp, color = subtitleColor)
            Spacer(Modifier.width(4.dp))
        }
        Icon(Icons.Default.ChevronRight, null, tint = ArrowGray, modifier = Modifier.size(18.dp))
    }
}

@Composable
private fun SettingsDivider() {
    HorizontalDivider(
        modifier = Modifier.padding(horizontal = 16.dp),
        thickness = 0.5.dp,
        color = DividerColor
    )
}
