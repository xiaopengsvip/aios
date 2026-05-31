package com.aios.app.core.auth

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume

/**
 * OAuth Manager - handles OAuth login via Chrome Custom Tabs
 * Flow: app opens browser -> user authorizes -> backend redirects to mobile-callback
 * -> deep link back to app with JWT token
 */
class OAuthManager(
    private val context: Context,
    private val authManager: AuthManager
) {
    companion object {
        const val BASE_URL = "https://aios.vios.top"
        const val CALLBACK_URL = "$BASE_URL/api/auth/oauth/mobile-callback"
    }

    private var pendingContinuation: ((OAuthResult?) -> Unit)? = null

    sealed class OAuthResult {
        data class Success(val token: String, val username: String) : OAuthResult()
        data class Error(val message: String) : OAuthResult()
    }

    fun getAuthorizationUrl(provider: String): String {
        return "$BASE_URL/api/auth/oauth/$provider?action=login&mobile=true"
    }

    fun openOAuthLogin(provider: String) {
        val url = getAuthorizationUrl(provider)
        val customTabsIntent = CustomTabsIntent.Builder()
            .setShowTitle(true)
            .build()
        customTabsIntent.launchUrl(context, Uri.parse(url))
    }

    /**
     * Handle deep link callback from OAuth
     * Called from MainActivity when aios://callback is received
     */
    fun handleCallback(uri: Uri): OAuthResult? {
        val token = uri.getQueryParameter("token")
        val username = uri.getQueryParameter("username") ?: ""
        val error = uri.getQueryParameter("error")

        return if (token != null) {
            OAuthResult.Success(token, username)
        } else if (error != null) {
            OAuthResult.Error(error)
        } else {
            null
        }
    }

    fun setPendingCallback(callback: (OAuthResult?) -> Unit) {
        pendingContinuation = callback
    }

    fun resolvePending(result: OAuthResult?) {
        pendingContinuation?.invoke(result)
        pendingContinuation = null
    }
}
