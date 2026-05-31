package com.aios.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
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

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            AIOSTheme {
                val navController = rememberNavController()
                val scope = rememberCoroutineScope()
                var isLoggedIn by remember { mutableStateOf<Boolean?>(null) }

                LaunchedEffect(Unit) {
                    isLoggedIn = authManager.isLoggedIn()
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
                        MainApp(navController = navController, onLogout = {
                            scope.launch {
                                authManager.clearAll()
                                isLoggedIn = false
                                navController.navigate(Screen.Login.route) {
                                    popUpTo(0) { inclusive = true }
                                }
                            }
                        })
                    }
                }
            }
        }
    }
}

data class NavItem(val screen: Screen, val icon: @Composable () -> Unit)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainApp(navController: NavHostController, onLogout: () -> Unit) {
    val innerNavController = rememberNavController()

    val items = listOf(
        NavItem(Screen.Chat) { Icon(Icons.Default.Chat, contentDescription = "对话") },
        NavItem(Screen.Agent) { Icon(Icons.Default.SmartToy, contentDescription = "Agent") },
        NavItem(Screen.Knowledge) { Icon(Icons.Default.MenuBook, contentDescription = "知识库") },
        NavItem(Screen.Files) { Icon(Icons.Default.Folder, contentDescription = "文件") },
        NavItem(Screen.Settings) { Icon(Icons.Default.Settings, contentDescription = "设置") },
    )

    Scaffold(
        bottomBar = {
            NavigationBar {
                val navBackStackEntry by innerNavController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination

                items.forEach { item ->
                    NavigationBarItem(
                        icon = item.icon,
                        label = { Text(item.screen.label) },
                        selected = currentDestination?.hierarchy?.any { it.route == item.screen.route } == true,
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
            composable(Screen.Settings.route) { SettingsScreen(onLogout = onLogout, navController = innerNavController) }

            // Feature pages
            composable(Screen.Image.route) { ImageScreen() }
            composable(Screen.Audio.route) { AudioScreen() }
            composable(Screen.Video.route) { VideoScreen() }
            composable(Screen.Code.route) { CodeScreen() }
            composable(Screen.Workflow.route) { WorkflowScreen() }
            composable(Screen.Prompts.route) { PromptsScreen() }
            composable(Screen.Marketplace.route) { MarketplaceScreen() }
            composable(Screen.Search.route) { SearchScreen() }
            composable(Screen.Usage.route) { UsageScreen() }
            composable(Screen.Credits.route) { CreditsScreen() }
            composable(Screen.ApiPlatform.route) { ApiPlatformScreen() }
        }
    }
}
