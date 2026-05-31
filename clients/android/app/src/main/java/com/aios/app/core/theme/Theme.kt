package com.aios.app.core.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext

// ── Color Palette (matches AIOS web) ──
private val LightColors = lightColorScheme(
    primary = Color(0xFF6366F1),          // Indigo-500
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE0E7FF), // Indigo-100
    onPrimaryContainer = Color(0xFF312E81),
    secondary = Color(0xFF8B5CF6),        // Violet-500
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFEDE9FE),
    onSecondaryContainer = Color(0xFF4C1D95),
    tertiary = Color(0xFF06B6D4),         // Cyan-500
    background = Color(0xFFF8FAFC),       // Slate-50
    onBackground = Color(0xFF0F172A),     // Slate-900
    surface = Color.White,
    onSurface = Color(0xFF0F172A),
    surfaceVariant = Color(0xFFF1F5F9),   // Slate-100
    onSurfaceVariant = Color(0xFF475569), // Slate-600
    outline = Color(0xFFCBD5E1),          // Slate-300
    error = Color(0xFFEF4444),
    onError = Color.White,
)

private val DarkColors = darkColorScheme(
    primary = Color(0xFF818CF8),          // Indigo-400
    onPrimary = Color(0xFF1E1B4B),
    primaryContainer = Color(0xFF3730A3), // Indigo-700
    onPrimaryContainer = Color(0xFFE0E7FF),
    secondary = Color(0xFFA78BFA),        // Violet-400
    onSecondary = Color(0xFF2E1065),
    secondaryContainer = Color(0xFF5B21B6),
    onSecondaryContainer = Color(0xFFEDE9FE),
    tertiary = Color(0xFF22D3EE),         // Cyan-400
    background = Color(0xFF0F172A),       // Slate-900
    onBackground = Color(0xFFF1F5F9),
    surface = Color(0xFF1E293B),          // Slate-800
    onSurface = Color(0xFFF1F5F9),
    surfaceVariant = Color(0xFF334155),   // Slate-700
    onSurfaceVariant = Color(0xFF94A3B8), // Slate-400
    outline = Color(0xFF475569),          // Slate-600
    error = Color(0xFFF87171),
    onError = Color(0xFF450A0A),
)

@Composable
fun AIOSTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context)
            else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColors
        else -> LightColors
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
