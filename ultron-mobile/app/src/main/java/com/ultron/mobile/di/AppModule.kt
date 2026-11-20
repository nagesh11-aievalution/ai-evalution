package com.ultron.mobile.di

import com.ultron.mobile.data.device.AndroidDeviceStatusProvider
import com.ultron.mobile.domain.interfaces.DeviceStatusProvider
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent

/** Binds domain interfaces to their Android implementations. */
@Module
@InstallIn(SingletonComponent::class)
abstract class AppModule {
    @Binds
    abstract fun bindDeviceStatusProvider(impl: AndroidDeviceStatusProvider): DeviceStatusProvider
}
