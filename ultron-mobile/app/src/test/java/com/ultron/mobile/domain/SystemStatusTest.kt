package com.ultron.mobile.domain

import com.ultron.mobile.domain.models.NetworkType
import com.ultron.mobile.domain.models.SystemStatus
import org.junit.Assert.assertEquals
import org.junit.Test

class SystemStatusTest {
    private fun status(percent: Int?, charging: Boolean) =
        SystemStatus("Pixel", "15", 35, percent, charging, NetworkType.WIFI, true)

    @Test fun batteryLabel_plain() = assertEquals("82%", status(82, false).batteryLabel)
    @Test fun batteryLabel_charging() = assertEquals("40% · charging", status(40, true).batteryLabel)
    @Test fun batteryLabel_unknown() = assertEquals("Unknown", status(null, false).batteryLabel)
}
