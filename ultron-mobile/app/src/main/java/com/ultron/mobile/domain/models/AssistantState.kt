package com.ultron.mobile.domain.models

/** What the assistant is doing right now; drives the core animation and status line. */
sealed interface AssistantState {
    data object Idle : AssistantState
    data object Listening : AssistantState
    data object Thinking : AssistantState
    data object Speaking : AssistantState
    data class Error(val message: String) : AssistantState
}
