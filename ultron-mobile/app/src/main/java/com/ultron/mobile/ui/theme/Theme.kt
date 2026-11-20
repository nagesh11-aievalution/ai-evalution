package com.ultron.mobile.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val UltronColorScheme = darkColorScheme(
    primary = UltronColors.Red,
    onPrimary = UltronColors.Text,
    secondary = UltronColors.RedSoft,
    background = UltronColors.Black,
    onBackground = UltronColors.Text,
    surface = UltronColors.Surface,
    onSurface = UltronColors.Text,
    surfaceVariant = UltronColors.SurfaceRaised,
    onSurfaceVariant = UltronColors.TextMuted,
    outline = UltronColors.Outline,
    error = UltronColors.RedSoft,
)

/** ULTRON is always dark: pure black with a red accent. */
@Composable
fun UltronTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = UltronColorScheme, typography = UltronTypography, content = content)
}
