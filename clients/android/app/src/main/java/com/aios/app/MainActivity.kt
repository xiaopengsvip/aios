package com.aios.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import com.aios.app.core.auth.AuthManager
import com.aios.app.core.update.UpdateManager
import com.aios.app.core.update.UpdateDialog
import com.aios.app.core.update.UpdateState
import com.aios.app.core.update.VersionInfo
import com.aios.app.core.navigation.Screen
import com.aios.app.core.theme.AIOSTheme
import com.aios.app.feature.auth.LoginScreen
import com.aios.app.feature.auth.RegisterScreen
import com.aios.app.feature.auth.ForgotPasswordScreen
import com.aios.app.feature.chat.ChatScreen
import com.aios.app.feature.agent.AgentScreen
import com.aios.app.feature.settings.SettingsScreen
import com.aios.app.feature.image.ImageScreen
import com.aios.app.feature.audio.AudioScreen
import com.aios.app.feature.video.VideoScreen
import com.aios.app.feature.code.CodeScreen
import com.aios.app.feature.workflow.WorkflowScreen
import com.aios.app.feature.prompts.PromptsScreen
import com.aios.app.feature.marketplace.MarketplaceScreen
import com.aios.app.feature.knowledge.KnowledgeScreen
import com.aios.app.feature.files.FilesScreen
import com.aios.app.feature.search.SearchScreen
import com.aios.app.feature.usage.UsageScreen
import com.aios.app.feature.credits.CreditsScreen
import com.aios.app.feature.apiplatform.ApiPlatformScreen
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var authManager: AuthManager
    @Inject lateinit var updateManager: UpdateManager

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            AIOSTheme {
                val navController = rememberNavController()
                val scope = rememberCoroutineScope()
                var isLoggedIn by remember { mutableStateOf<Boolean?>(null) }
                var updateState by remember { mutableStateOf(UpdateState()) }

                LaunchedEffect(Unit) {
                    isLoggedIn = authManager.isLoggedIn()
                    // Report device install
                    updateManager.reportInstall()
                    // Check for updates
                    val versionInfo = updateManager.checkForUpdate()
                    if (versionInfo != null) {
                        updateState = UpdateState(available = true, versionInfo = versionInfo)
                    }
                }

                when (isLoggedIn) {
                    null -> {
                        Box(modifier = Modifier.fillMaxSize()) {
                            CircularProgressIndicator()
                        }
                    }
                    false -> {
                        NavHost(navController = navController, startDestination = Screen.Login.route) {
                            composable(Screen.Login.route) {
                                LoginScreen(
                                    onLoginSuccess = {
                                        isLoggedIn = true
                                        navController.navigate(Screen.Chat.route) {
                                            popUpTo(Screen.Login.route) { inclusive = true }
                                        }
                                    },
                                    onNavigateToRegister = {
                                        navController.navigate(Screen.Register.route)
                                    },
                                    onNavigateToForgotPassword = {
                                        navController.navigate(Screen.ForgotPassword.route)
                                    }
                                )
                            }
                            composable(Screen.Register.route) {
                                RegisterScreen(
                                    onRegisterSuccess = {
                                        isLoggedIn = true
                                        navController.navigate(Screen.Chat.route) {
                                            popUpTo(Screen.Login.route) { inclusive = true }
                                        }
                                    },
                                    onNavigateToLogin = { navController.popBackStack() }
                                )
                            }
                            composable(Screen.ForgotPassword.route) {
                                ForgotPasswordScreen(
                                    onBackToLogin = { navController.popBackStack() }
                                )
                            }
                        }
                    }
                    true -> {
                        MainApp(
                            navController = navController,
                            updateManager = updateManager,
                            onUpdateAvailable = { info ->
                                updateState = UpdateState(available = true, versionInfo = info)
                            },
                            onLogout = {
                                scope.launch {
                                    authManager.clearAll()
                                    isLoggedIn = false
                                    navController.navigate(Screen.Login.route) {
                                        popUpTo(0) { inclusive = true }
                                    }
                                }
                            }
                        )
                    }
                }

                // Update dialog
                if (updateState.available && updateState.versionInfo != null) {
                    val isForce = updateState.versionInfo!!.versionCode < updateManager.getCurrentVersionCode().let {
                        // Force if below min supported
                        updateState.versionInfo!!.minSupportedCode
                    } && updateManager.getCurrentVersionCode() < updateState.versionInfo!!.minSupportedCode

                    UpdateDialog(
                        versionInfo = updateState.versionInfo!!,
                        downloading = updateState.downloading,
                        progress = updateState.progress,
                        onDownload = {
                            scope.launch {
                                updateState = updateState.copy(downloading = true, progress = 0)
                                val file = updateManager.downloadApk(updateState.versionInfo!!.downloadUrl) { progress ->
                                    updateState = updateState.copy(progress = progress)
                                }
                                if (file != null) {
                                    updateState = updateState.copy(downloading = false, downloadedFile = file)
                                    updateManager.installApk(file)
                                } else {
                                    updateState = updateState.copy(downloading = false, error = "下载失败")
                                }
                            }
                        },
                        onDismiss = { updateState = updateState.copy(available = false) },
                        forceUpdate = isForce
                    )
                }
            }
        }
    }
}

// Main tabs shown in bottom nav
private val mainTabs = setOf(
    Screen.Chat.route, Screen.Agent.route,
    Screen.Knowledge.route, Screen.Files.route, Screen.Settings.route
)

data class NavItem(val screen: Screen, val icon: @Composable () -> Unit)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainApp(
    navController: NavHostController,
    updateManager: UpdateManager,
    onUpdateAvailable: (VersionInfo) -> Unit,
    onLogout: () -> Unit
) {
    val innerNavController = rememberNavController()
    val navBackStackEntry by innerNavController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val showBottomBar = currentRoute in mainTabs

    val items = listOf(
        NavItem(Screen.Chat) { Icon(Icons.Default.Chat, contentDescription = "对话") },
        NavItem(Screen.Agent) { Icon(Icons.Default.SmartToy, contentDescription = "Agent") },
        NavItem(Screen.Knowledge) { Icon(Icons.Default.MenuBook, contentDescription = "知识库") },
        NavItem(Screen.Files) { Icon(Icons.Default.Folder, contentDescription = "文件") },
        NavItem(Screen.Settings) { Icon(Icons.Default.Settings, contentDescription = "设置") },
    )

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    items.forEach { item ->
                        NavigationBarItem(
                            icon = item.icon,
                            label = { Text(item.screen.label) },
                            selected = currentRoute == item.screen.route,
                            onClick = {
                                innerNavController.navigate(item.screen.route) {
                                    popUpTo(innerNavController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = innerNavController,
            startDestination = Screen.Chat.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            // Main tabs
            composable(Screen.Chat.route) { ChatScreen() }
            composable(Screen.Agent.route) { AgentScreen() }
            composable(Screen.Knowledge.route) { KnowledgeScreen() }
            composable(Screen.Files.route) { FilesScreen() }
            composable(Screen.Settings.route) {
                SettingsScreen(onLogout = onLogout, onCheckUpdate = {
                    // Trigger update check from settings
                    // Note: actual check happens in LaunchedEffect inside SettingsScreen
                }, navController = innerNavController)
            }

            // Feature pages (with back navigation)
            composable(Screen.Image.route) { ImageScreen(onBack = { innerNavController.popBackStack() }) }
            composable(Screen.Audio.route) { AudioScreen(onBack = { innerNavController.popBackStack() }) }
            composable(Screen.Video.route) { VideoScreen(onBack = { innerNavController.popBackStack() }) }
            composable(Screen.Code.route) { CodeScreen(onBack = { innerNavController.popBackStack() }) }
            composable(Screen.Workflow.route) { WorkflowScreen(onBack = { innerNavController.popBackStack() }) }
            composable(Screen.Prompts.route) { PromptsScreen(onBack = { innerNavController.popBackStack() }) }
            composable(Screen.Marketplace.route) { MarketplaceScreen(onBack = { innerNavController.popBackStack() }) }
            composable(Screen.Search.route) { SearchScreen(onBack = { innerNavController.popBackStack() }) }
            composable(Screen.Usage.route) { UsageScreen(onBack = { innerNavController.popBackStack() }) }
            composable(Screen.Credits.route) { CreditsScreen(onBack = { innerNavController.popBackStack() }) }
            composable(Screen.ApiPlatform.route) { ApiPlatformScreen(onBack = { innerNavController.popBackStack() }) }

            // WebView (with URL query parameter)
            composable("webview?url={url}") { backStackEntry ->
                val encodedUrl = backStackEntry.arguments?.getString("url") ?: ""
                val webUrl = java.net.URLDecoder.decode(encodedUrl, "UTF-8")
                com.aios.app.feature.webview.WebViewScreen(
                    url = webUrl,
                    onBack = { innerNavController.popBackStack() }
                )
            }
        }
    }
}
