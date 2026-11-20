package com.ultron.mobile.features.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ultron.mobile.domain.interfaces.DeviceStatusProvider
import com.ultron.mobile.domain.models.AssistantState
import com.ultron.mobile.domain.models.SystemStatus
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeUiState(
    val assistant: AssistantState = AssistantState.Idle,
    val status: SystemStatus? = null,
    val statusError: String? = null,
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val deviceStatus: DeviceStatusProvider,
) : ViewModel() {

    private val _state = MutableStateFlow(HomeUiState())
    val state: StateFlow<HomeUiState> = _state.asStateFlow()

    init {
        refreshStatus()
    }

    /** Re-reads battery, network and permissions (called on resume and after permission changes). */
    fun refreshStatus() {
        viewModelScope.launch {
            runCatching { deviceStatus.current() }
                .onSuccess { s -> _state.update { it.copy(status = s, statusError = null) } }
                .onFailure { e -> _state.update { it.copy(statusError = e.message ?: "Couldn't read device status") } }
        }
    }
}
