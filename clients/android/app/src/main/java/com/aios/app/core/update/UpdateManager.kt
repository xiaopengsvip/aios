package com.aios.app.core.update

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request
import java.io.File
import java.util.concurrent.TimeUnit

@Serializable
data class VersionInfo(
    val versionCode: Int = 0,
    val versionName: String = "",
    val minSupportedCode: Int = 0,
    val downloadUrl: String = "",
    val releaseNotes: String = "",
    val releasedAt: String = ""
)

data class UpdateState(
    val checking: Boolean = false,
    val available: Boolean = false,
    val downloading: Boolean = false,
    val progress: Int = 0,
    val error: String? = null,
    val versionInfo: VersionInfo? = null,
    val downloadedFile: File? = null
)

class UpdateManager(
    private val context: Context,
    private val json: Json
) {
    private val baseUrl = "https://aios.vios.top"
    private val prefs = context.getSharedPreferences("aios_prefs", Context.MODE_PRIVATE)
    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(10, TimeUnit.SECONDS)
        .build()

    /**
     * Report device install on first launch.
     * Uses SharedPreferences to track if already reported.
     */
    suspend fun reportInstall() = withContext(Dispatchers.IO) {
        val deviceId = prefs.getString("device_id", null)
            ?: java.util.UUID.randomUUID().toString().also { prefs.edit().putString("device_id", it).apply() }

        // Report on every launch (updates lastSeen)
        try {
            val body = org.json.JSONObject().apply {
                put("deviceId", deviceId)
                put("platform", "android")
                put("appVersion", getCurrentVersionName())
                put("osVersion", "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})")
                put("deviceModel", "${Build.MANUFACTURER} ${Build.MODEL}")
            }
            val request = Request.Builder()
                .url("$baseUrl/api/app/install")
                .post(okhttp3.RequestBody.create(
                    okhttp3.MediaType.parse("application/json"), body.toString()))
                .build()
            client.newCall(request).execute()
        } catch (_: Exception) { }
    }

    fun getCurrentVersionCode(): Int {
        return try {
            context.packageManager.getPackageInfo(context.packageName, 0).let {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) it.longVersionCode.toInt()
                else @Suppress("DEPRECATION") it.versionCode
            }
        } catch (_: Exception) { 0 }
    }

    fun getCurrentVersionName(): String {
        return try {
            context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "1.0.0"
        } catch (_: Exception) { "1.0.0" }
    }

    suspend fun checkForUpdate(): VersionInfo? = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder()
                .url("$baseUrl/api/app/version")
                .build()
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                val body = response.body?.string() ?: return@withContext null
                val info = json.decodeFromString<VersionInfo>(body)
                if (info.versionCode > getCurrentVersionCode()) info else null
            } else null
        } catch (_: Exception) { null }
    }

    suspend fun downloadApk(url: String, onProgress: (Int) -> Unit): File? = withContext(Dispatchers.IO) {
        try {
            val request = Request.Builder().url(url).build()
            val response = client.newCall(request).execute()
            if (!response.isSuccessful) return@withContext null

            val body = response.body ?: return@withContext null
            val totalBytes = body.contentLength()
            val file = File(context.cacheDir, "aios-update.apk")
            if (file.exists()) file.delete()

            body.byteStream().use { input ->
                file.outputStream().use { output ->
                    val buffer = ByteArray(8192)
                    var bytesRead: Int
                    var totalRead = 0L
                    while (input.read(buffer).also { bytesRead = it } != -1) {
                        output.write(buffer, 0, bytesRead)
                        totalRead += bytesRead
                        if (totalBytes > 0) {
                            onProgress((totalRead * 100 / totalBytes).toInt())
                        }
                    }
                }
            }
            file
        } catch (_: Exception) { null }
    }

    fun installApk(file: File) {
        val intent = Intent(Intent.ACTION_VIEW).apply {
            val uri = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
            } else {
                Uri.fromFile(file)
            }
            setDataAndType(uri, "application/vnd.android.package-archive")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}
