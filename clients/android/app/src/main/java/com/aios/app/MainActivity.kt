package com.aios.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import com.aios.app.core.auth.AuthManager
import com.aios.app.core.navigation.Screen
import com.aios.app.core.theme.AIOSTheme
import com.aios.app.feature.auth.LoginScreen
import com.aios.app.feature.chat.ChatScreen
import com.aios.app.feature.agent.AgentScreen
import com.aios.app.feature.settings.SettingsScreen
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    @Inject lateinit var authManager: AuthManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            AIOSTheme {
                val navController = rememberNavController()
                val scope = rememberCoroutineScope()
                var isLoggedIn by remember { mutableStateOf<Boolean?>(null) }

                // Check auth on launch
                LaunchedEffect(Unit) {
                    isLoggedIn = authManager.isLoggedIn()
                }

                when (isLoggedIn) {
                    null -> {
                        // Loading
                        Box(modifier = Modifier.fillMaxSize()) {
                            CircularProgressIndicator()
                        }
                    }
                    false -> {
                        // Auth flow
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
                                LoginScreen(
                                    isRegister = true,
                                    onLoginSuccess = {
                                        isLoggedIn = true
                                        navController.navigate(Screen.Chat.route) {
                                            popUpTo(Screen.Login.route) { inclusive = true }
                                        }
                                    },
                                    onNavigateToRegister = {
                                        navController.popBackStack()
                                    }
                                )
                            }
                        }
                    }
                    true -> {
                        // Main app with bottom nav
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainApp(navController: NavHostController, onLogout: () -> Unit) {
    val innerNavController = rememberNavController()

    data class NavItem(val screen: Screen, val label: String, val icon: @Composable () -> Unit)

    val items = listOf(
        NavItem(Screen.Chat, "对话") { Icon(Icons.Default.Chat, contentDescription = "对话") },
        NavItem(Screen.Agent, "Agent") { Icon(Icons.Default.SmartToy, contentDescription = "Agent") },
        NavItem(Screen.Workflow, "工作流") { Icon(Icons.Default.AccountTree, contentDescription = "工作流") },
        NavItem(Screen.Settings, "设置") { Icon(Icons.Default.Settings, contentDescription = "设置") },
    )

    Scaffold(
        bottomBar = {
            NavigationBar {
                val navBackStackEntry by innerNavController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination

                items.forEach { item ->
                    NavigationBarItem(
                        icon = item.icon,
                        label = { Text(item.label) },
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
            composable(Screen.Chat.route) { ChatScreen() }
            composable(Screen.Agent.route) { AgentScreen() }
            composable(Screen.Workflow.route) {
                Box(modifier = Modifier.fillMaxSize()) {
                    Text("工作流", modifier = Modifier.padding(androidx.compose.ui.unit.dp.times(16)))
                }
            }
            composable(Screen.Settings.route) { SettingsScreen(onLogout = onLogout) }
        }
    }
}
