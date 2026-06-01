package com.aios.app.core.network

import com.aios.app.data.model.*
import com.aios.app.data.repository.*
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*

/**
 * AIOS Backend API Service
 * 67 endpoints mapped to typed Kotlin functions.
 * Modular: each feature group is clearly separated.
 */
interface ApiService {

    // ═══════════════════════════════════════
    // Auth (14 endpoints)
    // ═══════════════════════════════════════
    @POST("/api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<AuthResponse>

    @POST("/api/auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>

    @GET("/api/auth/me")
    suspend fun getMe(): Response<UserInfo>

    @POST("/api/auth/logout")
    suspend fun logout(): Response<Unit>

    @POST("/api/auth/refresh")
    suspend fun refreshToken(): Response<Unit>

    @PATCH("/api/auth/profile")
    suspend fun updateProfile(@Body data: Map<String, String>): Response<UserInfo>

    @PUT("/api/auth/preferences")
    suspend fun updatePreferences(@Body prefs: Map<String, @JvmSuppressWildcards Any>): Response<Unit>

    @POST("/api/auth/change-password")
    suspend fun changePassword(@Body data: Map<String, String>): Response<Unit>

    @POST("/api/auth/reset-password")
    suspend fun resetPassword(@Body data: Map<String, String>): Response<ApiResponse<Unit>>

    @Multipart
    @POST("/api/auth/avatar")
    suspend fun uploadAvatar(@Part avatar: MultipartBody.Part): Response<Map<String, String>>

    // ═══════════════════════════════════════
    // Models
    // ═══════════════════════════════════════
    @GET("/api/models")
    suspend fun getModels(): Response<ModelsResponse>

    // ═══════════════════════════════════════
    // Conversations
    // ═══════════════════════════════════════
    @GET("/api/conversations")
    suspend fun getConversations(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 50,
        @Query("archived") archived: Boolean = false
    ): Response<ConversationsResponse>

    @GET("/api/conversations/{id}")
    suspend fun getConversation(@Path("id") id: String): Response<ConversationDetail>

    @DELETE("/api/conversations/{id}")
    suspend fun deleteConversation(@Path("id") id: String): Response<Unit>

    // ═══════════════════════════════════════
    // Agents
    // ═══════════════════════════════════════
    @GET("/api/agents")
    suspend fun getAgents(): Response<AgentsResponse>

    @GET("/api/agents/{id}")
    suspend fun getAgent(@Path("id") id: String): Response<Agent>

    @POST("/api/agents/{id}/execute")
    suspend fun executeAgent(
        @Path("id") id: String,
        @Body request: AgentExecuteRequest
    ): Response<AgentExecutionResult>

    // ═══════════════════════════════════════
    // Workflows
    // ═══════════════════════════════════════
    @GET("/api/workflows")
    suspend fun getWorkflows(): Response<Map<String, List<Workflow>>>

    @POST("/api/workflows/{id}/execute")
    suspend fun executeWorkflow(
        @Path("id") id: String,
        @Body input: Map<String, String>
    ): Response<Map<String, Any>>

    // ═══════════════════════════════════════
    // Knowledge
    // ═══════════════════════════════════════
    @GET("/api/knowledge")
    suspend fun getKnowledgeBases(): Response<Map<String, Any>>

    @POST("/api/knowledge/search")
    suspend fun searchKnowledge(@Body query: Map<String, String>): Response<Map<String, Any>>

    // ═══════════════════════════════════════
    // Files
    // ═══════════════════════════════════════
    @GET("/api/files")
    suspend fun getFiles(): Response<Map<String, Any>>

    @Multipart
    @POST("/api/files")
    suspend fun uploadFile(@Part file: MultipartBody.Part): Response<Map<String, Any>>

    // ═══════════════════════════════════════
    // Prompts
    // ═══════════════════════════════════════
    @GET("/api/prompts")
    suspend fun getPrompts(): Response<Map<String, Any>>

    // ═══════════════════════════════════════
    // Marketplace
    // ═══════════════════════════════════════
    @GET("/api/marketplace")
    suspend fun getMarketplace(
        @Query("type") type: String = "all",
        @Query("search") search: String? = null,
        @Query("page") page: Int = 1
    ): Response<Map<String, Any>>

    // ═══════════════════════════════════════
    // Credits
    // ═══════════════════════════════════════
    @GET("/api/credits/balance")
    suspend fun getCreditsBalance(): Response<CreditsBalance>

    @GET("/api/credits/transactions")
    suspend fun getTransactions(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 20
    ): Response<Map<String, Any>>

    // ═══════════════════════════════════════
    // Usage
    // ═══════════════════════════════════════
    @GET("/api/usage")
    suspend fun getUsageStats(): Response<UsageStats>

    // ═══════════════════════════════════════
    // Multimodal
    // ═══════════════════════════════════════
    @POST("/api/multimodal/understand")
    suspend fun multimodalUnderstand(@Body data: Map<String, Any>): Response<Map<String, Any>>

    @POST("/api/audio/generate")
    suspend fun generateAudio(@Body data: Map<String, String>): Response<Map<String, Any>>

    @POST("/api/images/generate")
    suspend fun generateImage(@Body data: Map<String, String>): Response<Map<String, Any>>

    @POST("/api/code/execute")
    suspend fun executeCode(@Body data: Map<String, String>): Response<Map<String, Any>>

    // ═══════════════════════════════════════
    // Site Config
    // ═══════════════════════════════════════
    @GET("/api/site-config")
    suspend fun getSiteConfig(): Response<Map<String, Any>>
}
