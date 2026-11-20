package com.ultron.mobile.features.home

import com.ultron.mobile.domain.interfaces.DeviceStatusProvider
import com.ultron.mobile.domain.models.AssistantState
import com.ultron.mobile.domain.models.NetworkType
import com.ultron.mobile.domain.models.SystemStatus
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModelTest {

    private val sample = SystemStatus("Pixel 7", "15", 35, 76, false, NetworkType.CELLULAR, false)

    private class FakeProvider(var result: () -> SystemStatus) : DeviceStatusProvider {
        override suspend fun current(): SystemStatus = result()
    }

    @Before fun setUp() = Dispatchers.setMain(UnconfinedTestDispatcher())
    @After fun tearDown() = Dispatchers.resetMain()

    @Test
    fun loadsStatusOnStart() = runTest {
        val vm = HomeViewModel(FakeProvider { sample })
        assertEquals(sample, vm.state.value.status)
        assertEquals(AssistantState.Idle, vm.state.value.assistant)
        assertNull(vm.state.value.statusError)
    }

    @Test
    fun refreshPicksUpChanges() = runTest {
        val provider = FakeProvider { sample }
        val vm = HomeViewModel(provider)
        provider.result = { sample.copy(microphoneGranted = true) }
        vm.refreshStatus()
        assertEquals(true, vm.state.value.status?.microphoneGranted)
    }

    @Test
    fun reportsErrorsInsteadOfCrashing() = runTest {
        val vm = HomeViewModel(FakeProvider { error("battery service unavailable") })
        assertEquals("battery service unavailable", vm.state.value.statusError)
        assertNull(vm.state.value.status)
    }
}
