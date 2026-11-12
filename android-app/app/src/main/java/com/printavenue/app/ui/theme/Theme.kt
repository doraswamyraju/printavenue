package com.printavenue.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFF43F5E),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFBE123C),
    secondary = Color(0xFF38BDF8),
    onSecondary = Color.Black,
    background = Color(0xFF020617),
    surface = Color(0xFF0F172A),
    onSurface = Color.White,
    onBackground = Color.White
)

@Composable
fun PrintAvenueTheme(
    darkTheme: Boolean = true, // Default to sleek dark print studio theme
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography(),
        content = content
    )
}
