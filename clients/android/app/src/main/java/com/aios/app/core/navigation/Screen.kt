package com.aios.app.core.navigation

/**
 * Navigation routes for the app - matches web app routes
 */
sealed class Screen(val route: String, val label: String, val icon: String) {
    // Auth
    data object Login : Screen("login", "登录", "login")
    data object Register : Screen("register", "注册", "person_add")
    data object ForgotPassword : Screen("forgot-password", "找回密码", "lock_reset")

    // Main tabs
    data object Chat : Screen("chat", "对话", "chat")
    data object Agent : Screen("agent", "Agent", "smart_toy")
    data object Knowledge : Screen("knowledge", "知识库", "menu_book")
    data object Files : Screen("files", "文件", "folder")
    data object Settings : Screen("settings", "设置", "settings")

    // Feature pages
    data object Image : Screen("image", "AI 绘图", "image")
    data object Audio : Screen("audio", "语音", "mic")
    data object Video : Screen("video", "视频", "videocam")
    data object Code : Screen("code", "代码", "code")
    data object Workflow : Screen("workflow", "工作流", "account_tree")
    data object Prompts : Screen("prompts", "提示词", "format_quote")
    data object Marketplace : Screen("marketplace", "市场", "storefront")
    data object Search : Screen("search", "搜索", "search")
    data object Usage : Screen("usage", "用量", "bar_chart")
    data object Credits : Screen("credits", "积分", "account_balance_wallet")
    data object ApiPlatform : Screen("api-platform", "API", "api")

    // Detail pages
    data object ChatDetail : Screen("chat/{conversationId}", "对话详情", "chat") {
        fun createRoute(id: String) = "chat/$id"
    }
    data object AgentDetail : Screen("agent/{agentId}", "Agent 详情", "smart_toy") {
        fun createRoute(id: String) = "agent/$id"
    }
}

/** Bottom navigation items */
val bottomNavItems = listOf(
    Screen.Chat,
    Screen.Agent,
    Screen.Knowledge,
    Screen.Files,
    Screen.Settings,
)

/** Feature grid items (shown on home/tools page) */
val featureItems = listOf(
    Screen.Image,
    Screen.Audio,
    Screen.Video,
    Screen.Code,
    Screen.Workflow,
    Screen.Prompts,
    Screen.Marketplace,
    Screen.Search,
    Screen.Usage,
    Screen.Credits,
    Screen.ApiPlatform,
)
