package com.aios.app.data.repository

import com.aios.app.data.model.*
import com.aios.app.core.network.ApiService
import com.aios.app.core.auth.AuthManager
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Auth Repository - 登录/注册/用户信息
 * 使用 JWT Bearer token 认证（非 cookie）
 */
@Singleton
class AuthRepository @Inject constructor(
    private val api: ApiService,
    private val authManager: AuthManager
) {
    val isLoggedIn: Flow<Boolean> = flow { emit(authManager.getToken() != null) }
    val currentUser: Flow<UserInfo?> = flow { emit(authManager.getUser()) }

    suspend fun login(email: String, password: String): Result<UserInfo> = try {
        val resp = api.login(LoginRequest(email = email, password = password))
        if (resp.isSuccessful && resp.body()?.success == true) {
            val body = resp.body()!!
            val user = body.user!!
            // Save JWT token from response (Bearer auth)
            val token = resp.headers()["set-cookie"]
                ?.let { cookie -> parseTokenFromCookie(cookie) }
                ?: body.token
            if (token != null) {
                authManager.saveToken(token)
            }
            authManager.saveUser(user)
            Result.success(user)
        } else {
            Result.failure(Exception(resp.body()?.message ?: "登录失败"))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }

    suspend fun register(username: String, email: String, password: String): Result<UserInfo> = try {
        val resp = api.register(RegisterRequest(username = username, email = email, password = password))
        if (resp.isSuccessful && resp.body()?.success == true) {
            val body = resp.body()!!
            val user = body.user!!
            val token = body.token
            if (token != null) {
                authManager.saveToken(token)
            }
            authManager.saveUser(user)
            Result.success(user)
        } else {
            Result.failure(Exception(resp.body()?.message ?: "注册失败"))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }

    suspend fun getMe(): Result<UserInfo> = try {
        val resp = api.getMe()
        if (resp.isSuccessful) {
            val user = resp.body()!!
            authManager.saveUser(user)
            Result.success(user)
        } else {
            Result.failure(Exception("获取用户信息失败"))
        }
    } catch (e: Exception) {
        Result.failure(e)
    }

    suspend fun logout() {
        try { api.logout() } catch (_: Exception) {}
        authManager.clearAll()
    }

    suspend fun requestResetCode(email: String): Result<String> = try {
        val resp = api.resetPassword(mapOf("action" to "request", "email" to email))
        if (resp.isSuccessful) {
            Result.success(resp.body()?.message ?: "验证码已发送")
        } else {
            Result.failure(Exception("发送失败"))
        }
    } catch (e: Exception) { Result.failure(e) }

    suspend fun confirmResetPassword(email: String, code: String, newPassword: String): Result<String> = try {
        val resp = api.resetPassword(mapOf("action" to "confirm", "email" to email, "code" to code, "newPassword" to newPassword))
        if (resp.isSuccessful) {
            Result.success(resp.body()?.message ?: "密码已重置")
        } else {
            val errBody = resp.errorBody()?.string()
            val msg = try { kotlinx.serialization.json.Json { ignoreUnknownKeys = true }
                .decodeFromString<Map<String, String>>(errBody ?: "")["error"] } catch (_: Exception) { null }
            Result.failure(Exception(msg ?: "重置失败"))
        }
    } catch (e: Exception) { Result.failure(e) }

    suspend fun updateProfile(displayName: String?, bio: String?): Result<UserInfo> = try {
        val body = mutableMapOf<String, String>()
        displayName?.let { body["displayName"] = it }
        bio?.let { body["bio"] = it }
        val resp = api.updateProfile(body)
        if (resp.isSuccessful) getMe() else Result.failure(Exception("更新失败"))
    } catch (e: Exception) {
        Result.failure(e)
    }

    private fun parseTokenFromCookie(cookieHeader: String): String? {
        // Parse aios_access=xxx from Set-Cookie header
        return cookieHeader.split(";")
            .map { it.trim() }
            .firstOrNull { it.startsWith("aios_access=") }
            ?.substringAfter("aios_access=")
            ?.takeIf { it.isNotBlank() }
    }
}
