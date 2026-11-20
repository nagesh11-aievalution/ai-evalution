package com.ultron.mobile.features.home

import android.Manifest
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.ultron.mobile.BuildConfig
import com.ultron.mobile.domain.models.AssistantState
import com.ultron.mobile.domain.models.NetworkType
import com.ultron.mobile.domain.models.SystemStatus
import com.ultron.mobile.features.home.components.UltronCore
import com.ultron.mobile.ui.theme.UltronColors
import com.ultron.mobile.ui.theme.UltronTheme

@Composable
fun HomeRoute(viewModel: HomeViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    // Battery/network/permissions can change while the app is in the background.
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) { viewModel.refreshStatus() }
    val micLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
        viewModel.refreshStatus()
    }
    HomeScreen(
        state = state,
        onRequestMicrophone = { micLauncher.launch(Manifest.permission.RECORD_AUDIO) },
    )
}

@Composable
fun HomeScreen(state: HomeUiState, onRequestMicrophone: () -> Unit) {
    Box(
        Modifier
            .fillMaxSize()
            .background(UltronColors.Black)
            .safeDrawingPadding(),
        contentAlignment = Alignment.TopCenter,
    ) {
        Column(
            Modifier
                .widthIn(max = 560.dp)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Header()
            Spacer(Modifier.height(36.dp))
            UltronCore(state.assistant)
            Spacer(Modifier.height(16.dp))
            Text(
                text = statusLine(state.assistant),
                style = MaterialTheme.typography.labelMedium,
                color = UltronColors.TextMuted,
                textAlign = TextAlign.Center,
            )
            Spacer(Modifier.height(36.dp))
            SystemPanel(state.status, state.statusError, onRequestMicrophone)
        }
    }
}

@Composable
private fun Header() {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text("ULTRON", style = MaterialTheme.typography.titleMedium, color = UltronColors.RedSoft)
        Spacer(Modifier.weight(1f))
        Text(
            "v${BuildConfig.VERSION_NAME}",
            style = MaterialTheme.typography.labelSmall,
            color = UltronColors.TextMuted,
            modifier = Modifier
                .border(1.dp, UltronColors.Outline, RoundedCornerShape(50))
                .padding(horizontal = 10.dp, vertical = 3.dp),
        )
    }
}

private fun statusLine(s: AssistantState): String = when (s) {
    AssistantState.Idle -> "SYSTEMS ONLINE"
    AssistantState.Listening -> "LISTENING"
    AssistantState.Thinking -> "THINKING"
    AssistantState.Speaking -> "SPEAKING"
    is AssistantState.Error -> s.message
}

@Composable
private fun SystemPanel(status: SystemStatus?, error: String?, onRequestMicrophone: () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .background(UltronColors.Surface, RoundedCornerShape(16.dp))
            .border(1.dp, UltronColors.Outline, RoundedCornerShape(16.dp))
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("SYSTEM STATUS", style = MaterialTheme.typography.labelSmall, color = UltronColors.TextMuted)
        when {
            error != null -> Text(error, color = UltronColors.RedSoft, style = MaterialTheme.typography.bodyMedium)
            status == null -> Text("Reading device…", color = UltronColors.TextMuted, style = MaterialTheme.typography.bodyMedium)
            else -> {
                StatusRow("Device", status.deviceName)
                StatusRow("Android", "${status.androidVersion} (API ${status.sdkInt})")
                StatusRow("Battery", status.batteryLabel, if ((status.batteryPercent ?: 100) <= 15 && !status.isCharging) UltronColors.Warn else UltronColors.Ok)
                StatusRow("Network", status.network.label, if (status.network == NetworkType.NONE) UltronColors.RedSoft else UltronColors.Ok)
                StatusRow(
                    "Microphone",
                    if (status.microphoneGranted) "Allowed" else "Not allowed",
                    if (status.microphoneGranted) UltronColors.Ok else UltronColors.Warn,
                )
                if (!status.microphoneGranted) {
                    Button(
                        onClick = onRequestMicrophone,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = UltronColors.Red, contentColor = Color.White),
                    ) { Text("Allow microphone") }
                }
            }
        }
    }
}

@Composable
private fun StatusRow(label: String, value: String, dot: Color? = null) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = UltronColors.TextMuted)
        Spacer(Modifier.weight(1f))
        if (dot != null) {
            Box(Modifier.size(7.dp).background(dot, CircleShape))
            Spacer(Modifier.size(8.dp))
        }
        Text(value, style = MaterialTheme.typography.bodyMedium, color = UltronColors.Text)
    }
}

@Preview(device = "id:pixel_7", backgroundColor = 0xFF000000, showBackground = true)
@Composable
private fun HomePreview() {
    UltronTheme {
        HomeScreen(
            state = HomeUiState(
                status = SystemStatus("Google Pixel 7", "15", 35, 82, false, NetworkType.WIFI, false),
            ),
            onRequestMicrophone = {},
        )
    }
}
