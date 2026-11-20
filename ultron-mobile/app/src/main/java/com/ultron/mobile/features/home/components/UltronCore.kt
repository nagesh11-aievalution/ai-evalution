package com.ultron.mobile.features.home.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.ultron.mobile.domain.models.AssistantState
import com.ultron.mobile.ui.theme.UltronColors

/**
 * The ULTRON core: concentric red rings around a glowing eye.
 * Idle breathes, Listening pulses outward, Thinking spins, Speaking throbs, Error dims.
 */
@Composable
fun UltronCore(state: AssistantState, modifier: Modifier = Modifier, size: Dp = 168.dp) {
    val t = rememberInfiniteTransition(label = "core")
    val breathe by t.animateFloat(
        initialValue = 0.82f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1600), RepeatMode.Reverse), label = "breathe",
    )
    val pulse by t.animateFloat(
        initialValue = 0f, targetValue = 1f,
        animationSpec = infiniteRepeatable(tween(1100, easing = LinearEasing)), label = "pulse",
    )
    val spin by t.animateFloat(
        initialValue = 0f, targetValue = 360f,
        animationSpec = infiniteRepeatable(tween(2400, easing = LinearEasing)), label = "spin",
    )
    val talk by t.animateFloat(
        initialValue = 0.85f, targetValue = 1.3f,
        animationSpec = infiniteRepeatable(tween(320), RepeatMode.Reverse), label = "talk",
    )

    val accent = if (state is AssistantState.Error) Color(0xFF555055) else UltronColors.Red

    Canvas(modifier.size(size)) {
        val c = center
        val r = this.size.minDimension / 2f
        val stroke = 1.5.dp.toPx()

        // Ambient glow behind everything.
        drawCircle(
            brush = Brush.radialGradient(listOf(accent.copy(alpha = 0.22f), Color.Transparent), c, r),
            radius = r,
        )

        // Outer ring; pulses outward while listening.
        drawCircle(accent.copy(alpha = 0.35f), radius = r * 0.92f, style = Stroke(stroke))
        if (state is AssistantState.Listening) {
            drawCircle(
                accent.copy(alpha = 1f - pulse),
                radius = r * (0.7f + 0.3f * pulse),
                style = Stroke(stroke * 2),
            )
        }

        // Middle and inner rings; dashed and counter-rotating while thinking.
        val thinking = state is AssistantState.Thinking
        rotate(if (thinking) spin else 0f, c) {
            drawCircle(
                accent.copy(alpha = 0.6f), radius = r * 0.72f,
                style = Stroke(stroke, pathEffect = if (thinking) PathEffect.dashPathEffect(floatArrayOf(18f, 12f)) else null),
            )
        }
        rotate(if (thinking) -spin * 1.5f else 0f, c) {
            drawCircle(
                accent.copy(alpha = 0.9f), radius = r * 0.5f,
                style = Stroke(stroke * 1.4f, pathEffect = if (thinking) PathEffect.dashPathEffect(floatArrayOf(4f, 10f)) else null),
            )
        }

        // The eye.
        val eyeScale = when (state) {
            AssistantState.Idle -> breathe
            AssistantState.Listening -> 1.2f
            AssistantState.Speaking -> talk
            AssistantState.Thinking -> 0.95f
            is AssistantState.Error -> 0.8f
        }
        val eyeR = r * 0.14f * eyeScale
        drawCircle(
            brush = Brush.radialGradient(listOf(accent.copy(alpha = 0.6f), Color.Transparent), c, eyeR * 3.2f),
            radius = eyeR * 3.2f,
        )
        drawCircle(
            brush = Brush.radialGradient(
                listOf(if (state is AssistantState.Error) Color(0xFF888088) else UltronColors.Eye, accent),
                Offset(c.x, c.y), eyeR,
            ),
            radius = eyeR,
        )
    }
}

@Preview(backgroundColor = 0xFF000000, showBackground = true)
@Composable
private fun UltronCorePreview() {
    UltronCore(AssistantState.Idle)
}
