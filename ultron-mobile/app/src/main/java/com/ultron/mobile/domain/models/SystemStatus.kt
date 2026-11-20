package com.ultron.mobile.domain.models

/** Snapshot of the phone state shown on the home screen. */
data class SystemStatus(
    val deviceName: String,
    val androidVersion: String,
    val sdkInt: Int,
    val batteryPercent: Int?,
    val isCharging: Boolean,
    val network: NetworkType,
    val microphoneGranted: Boolean,
) {
    val batteryLabel: String
        get() = when {
            batteryPercent == null -> "Unknown"
            isCharging -> "$batteryPercent% · charging"
            else -> "$batteryPercent%"
        }
}

enum class NetworkType(val label: String) {
    WIFI("Wi-Fi"),
    CELLULAR("Mobile data"),
    ETHERNET("Ethernet"),
    VPN("VPN"),
    OTHER("Connected"),
    NONE("Offline"),
}
