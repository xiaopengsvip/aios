package com.aios.app.core.navigation

/**
 * Navigation routes for the app
 */
sealed class Screen(val route: String) {
    // Auth
    data object Login : Screen("login")
    data object Register : Screen("register")

    // Main
    data object Chat : Screen("chat")
    data object ChatDetail : Screen("chat/{conversationId}") {
        fun createRoute(id: String) = "chat/$id"
    }
    data object Agent : Screen("agent")
    data object AgentDetail : Screen("agent/{agentId}") {
        fun createRoute(id: String) = "agent/$id"
    }
    data object Workflow : Screen("workflow")
    data object Settings : Screen("settings")
    data object ModelSelector : Screen("model_selector")
}
