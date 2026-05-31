package com.aios.app.core.network

import com.aios.app.core.auth.AuthManager
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

/**
 * AuthInterceptor - Adds auth headers to API requests
 * Uses Cookie-based auth (aios_token) to match web session
 */
@Singleton
class AuthInterceptor @Inject constructor(
    private val authManager: AuthManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val token = runBlocking { authManager.getToken() }

        val request = if (token != null && token != "cookie") {
            // Bearer token mode (for platform API keys)
            original.newBuilder()
                .header("Authorization", "Bearer $token")
                .header("Content-Type", "application/json")
                .build()
        } else {
            // Cookie mode: cookies are handled by OkHttp CookieJar
            original.newBuilder()
                .header("Content-Type", "application/json")
                .build()
        }

        return chain.proceed(request)
    }
}
