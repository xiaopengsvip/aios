package com.aios.app.core.network

import com.aios.app.core.auth.AuthManager
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject
import javax.inject.Singleton

/**
 * AuthInterceptor - Adds Bearer token to all API requests
 */
@Singleton
class AuthInterceptor @Inject constructor(
    private val authManager: AuthManager
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val original = chain.request()
        val token = runBlocking { authManager.getToken() }

        val request = if (!token.isNullOrEmpty() && token != "cookie") {
            original.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
        } else {
            original
        }

        return chain.proceed(request)
    }
}
