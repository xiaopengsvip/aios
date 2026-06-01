package com.aios.app.feature.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.aios.app.data.model.UserInfo
import com.aios.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val user: UserInfo? = null,
    val successMessage: String? = null
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authRepo: AuthRepository
) : ViewModel() {

    private val _state = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = _state

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _state.value = LoginUiState(isLoading = true)
            authRepo.login(email, password).fold(
                onSuccess = { _state.value = LoginUiState(user = it) },
                onFailure = { _state.value = LoginUiState(error = it.message ?: "登录失败") }
            )
        }
    }

    fun register(username: String, email: String, password: String) {
        viewModelScope.launch {
            _state.value = LoginUiState(isLoading = true)
            authRepo.register(username, email, password).fold(
                onSuccess = { _state.value = LoginUiState(user = it) },
                onFailure = { _state.value = LoginUiState(error = it.message ?: "注册失败") }
            )
        }
    }

    fun requestResetCode(email: String) {
        viewModelScope.launch {
            _state.value = LoginUiState(isLoading = true)
            authRepo.requestResetCode(email).fold(
                onSuccess = { _state.value = LoginUiState(successMessage = it) },
                onFailure = { _state.value = LoginUiState(error = it.message ?: "发送失败") }
            )
        }
    }

    fun confirmResetPassword(email: String, code: String, newPassword: String) {
        viewModelScope.launch {
            _state.value = LoginUiState(isLoading = true)
            authRepo.confirmResetPassword(email, code, newPassword).fold(
                onSuccess = { _state.value = LoginUiState(successMessage = it) },
                onFailure = { _state.value = LoginUiState(error = it.message ?: "重置失败") }
            )
        }
    }

    fun clearError() { _state.value = _state.value.copy(error = null) }
    fun clearSuccess() { _state.value = _state.value.copy(successMessage = null) }
}
