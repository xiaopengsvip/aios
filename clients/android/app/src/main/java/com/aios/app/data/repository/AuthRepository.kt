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
            val user = resp.body()!!.user!!
            // Cookie-based auth: cookies are stored by OkHttp CookieJar
            authManager.saveUser(user)
            authManager.saveToken("cookie") // marker
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
            val user = resp.body()!!.user!!
            authManager.saveUser(user)
            authManager.saveToken("cookie")
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

    suspend fun updateProfile(displayName: String?, bio: String?): Result<UserInfo> = try {
        val body = mutableMapOf<String, String>()
        displayName?.let { body["displayName"] = it }
        bio?.let { body["bio"] = it }
        val resp = api.updateProfile(body)
        if (resp.isSuccessful) getMe() else Result.failure(Exception("更新失败"))
    } catch (e: Exception) {
        Result.failure(e)
    }
}
