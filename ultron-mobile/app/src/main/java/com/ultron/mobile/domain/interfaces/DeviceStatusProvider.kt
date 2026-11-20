package com.ultron.mobile.domain.interfaces

import com.ultron.mobile.domain.models.SystemStatus

/** Reads the current phone state. Implemented with Android APIs in data/device. */
interface DeviceStatusProvider {
    suspend fun current(): SystemStatus
}
