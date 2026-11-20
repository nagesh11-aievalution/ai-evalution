package com.ultron.mobile

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.By
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.Until
import org.junit.Assert.assertNotNull
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import java.util.regex.Pattern

/**
 * Runs on a real Android device/emulator: launches the app, checks the home
 * screen shows live system status, and walks through the microphone permission flow.
 */
@RunWith(AndroidJUnit4::class)
class HomeScreenDeviceTest {

    @get:Rule
    val compose = createAndroidComposeRule<MainActivity>()

    private fun waitForText(text: String) =
        compose.waitUntil(10_000) { compose.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty() }

    @Test
    fun homeShowsCoreAndLiveStatus() {
        compose.onNodeWithText("ULTRON").assertIsDisplayed()
        compose.onNodeWithText("SYSTEMS ONLINE").assertIsDisplayed()
        waitForText("Device")
        for (label in listOf("Device", "Android", "Battery", "Network", "Microphone")) {
            compose.onNodeWithText(label).assertIsDisplayed()
        }
        compose.onNodeWithText("v${BuildConfig.VERSION_NAME}").assertIsDisplayed()
    }

    @Test
    fun allowMicrophoneGrantsPermissionAndUpdatesPanel() {
        waitForText("Allow microphone")
        compose.onNodeWithText("Not allowed").assertIsDisplayed()
        compose.onNodeWithText("Allow microphone").performClick()

        // Android's own permission dialog (wording differs between versions).
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        val allow = device.wait(
            Until.findObject(By.text(Pattern.compile("(?i)(while using the app|only this time|allow)"))),
            10_000,
        )
        assertNotNull("System permission dialog did not appear", allow)
        allow.click()

        waitForText("Allowed")
        compose.onNodeWithText("Allowed").assertIsDisplayed()
        compose.waitUntil(5_000) { compose.onAllNodesWithText("Allow microphone").fetchSemanticsNodes().isEmpty() }
    }
}
