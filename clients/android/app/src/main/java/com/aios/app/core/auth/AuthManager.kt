package com.aios.app.core.auth

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import com.aios.app.data.model.UserInfo
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "aios_auth")

@Singleton
class AuthManager @Inject constructor(
    private val context: Context,
    private val json: Json
) {
    companion object {
        private val TOKEN_KEY = stringPreferencesKey("token")
        private val USER_KEY = stringPreferencesKey("user_json")
    }

    suspend fun isLoggedIn(): Boolean = getToken() != null

    suspend fun getToken(): String? =
        context.dataStore.data.map { it[TOKEN_KEY] }.first()

    suspend fun saveToken(token: String) {
        context.dataStore.edit { it[TOKEN_KEY] = token }
    }

    suspend fun getUser(): UserInfo? {
        val jsonStr = context.dataStore.data.map { it[USER_KEY] }.first() ?: return null
        return try { json.decodeFromString<UserInfo>(jsonStr) } catch (_: Exception) { null }
    }

    suspend fun saveUser(user: UserInfo) {
        context.dataStore.edit { it[USER_KEY] = json.encodeToString(user) }
    }

    suspend fun clearAll() {
        context.dataStore.edit { it.clear() }
    }
}
