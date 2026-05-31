package com.aios.app.data.repository

import com.aios.app.data.model.*
import com.aios.app.core.network.ApiService
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Agent Repository - Agent CRUD + 执行
 */
@Singleton
class AgentRepository @Inject constructor(private val api: ApiService) {

    suspend fun getAgents(): Result<List<Agent>> = try {
        val resp = api.getAgents()
        if (resp.isSuccessful) Result.success(resp.body()?.agents ?: emptyList())
        else Result.failure(Exception("获取 Agent 失败"))
    } catch (e: Exception) { Result.failure(e) }

    suspend fun getAgent(id: String): Result<Agent> = try {
        val resp = api.getAgent(id)
        if (resp.isSuccessful && resp.body() != null) Result.success(resp.body()!!)
        else Result.failure(Exception("Agent 不存在"))
    } catch (e: Exception) { Result.failure(e) }

    suspend fun executeAgent(id: String, input: String, modelId: String?): Result<AgentExecutionResult> = try {
        val resp = api.executeAgent(id, AgentExecuteRequest(input = input, modelId = modelId))
        if (resp.isSuccessful && resp.body() != null) Result.success(resp.body()!!)
        else Result.failure(Exception(resp.body()?.error ?: "执行失败"))
    } catch (e: Exception) { Result.failure(e) }
}

@kotlinx.serialization.Serializable
data class AgentsResponse(val agents: List<Agent> = emptyList())

@kotlinx.serialization.Serializable
data class AgentExecutionResult(
    val output: String? = null,
    val steps: List<AgentStep> = emptyList(),
    val status: String = "completed",
    val error: String? = null
)

@kotlinx.serialization.Serializable
data class AgentStep(
    val type: String,
    val content: String,
    val status: String = "done"
)
