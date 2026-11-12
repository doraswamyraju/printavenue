package com.printavenue.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.GenericShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.printavenue.app.data.model.DesignTemplate
import com.printavenue.app.data.model.ImageLayout

/**
 * Parses coordinate string "0% 0%, 34% 0%, 45% 38%..." into List of normalized Offsets (0..1)
 */
fun parsePolygonPoints(raw: String?): List<Offset> {
    if (raw.isNullOrBlank()) {
        return listOf(Offset(0f, 0f), Offset(1f, 0f), Offset(1f, 1f), Offset(0f, 1f))
    }
    return raw.split(",").mapNotNull { part ->
        val pieces = part.trim().split("\\s+".toRegex())
        if (pieces.size == 2) {
            val x = pieces[0].replace("%", "").toFloatOrNull() ?: 0f
            val y = pieces[1].replace("%", "").toFloatOrNull() ?: 0f
            Offset(x / 100f, y / 100f)
        } else null
    }
}

/**
 * Creates an arbitrary polygon GenericShape for Jetpack Compose clipping
 */
fun createPolygonShape(points: List<Offset>): GenericShape {
    return GenericShape { size, _ ->
        if (points.isNotEmpty()) {
            moveTo(points[0].x * size.width, points[0].y * size.height)
            for (i in 1 until points.size) {
                lineTo(points[i].x * size.width, points[i].y * size.height)
            }
            close()
        }
    }
}

/**
 * Resolves full server URL for assets like /uploads/...
 */
fun resolveAssetUrl(path: String?): String {
    if (path.isNullOrBlank()) return ""
    return if (path.startsWith("http://") || path.startsWith("https://")) {
        path
    } else {
        "https://printavenue.sriddha.com${if (path.startsWith("/")) "" else "/"}$path"
    }
}

/**
 * SheetCanvasRenderer is the native Jetpack Compose replica of SheetRenderer.tsx:
 * 1. Honors arbitrary polygon cutouts & under-artwork/above-artwork layering.
 * 2. Natural aspect ratio preservation (no vertical stretching).
 * 3. Branding logo badge placement (circular/square).
 * 4. Customized text slots over base artwork.
 */
@Composable
fun SheetCanvasRenderer(
    template: DesignTemplate,
    productCategory: String = "calendar",
    userImageUrl: String? = null,
    logoUrl: String? = null,
    customTexts: Map<String, String>? = null,
    onPickPhotoClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val imageLayout = template.imageLayout
    val isUnderArtwork = imageLayout.layerPosition == "under-artwork"
    
    // Parse polygon points
    val points = remember(imageLayout.polygonPoints) {
        parsePolygonPoints(imageLayout.polygonPoints)
    }
    val polygonClip = remember(points) {
        createPolygonShape(points)
    }

    // Natural aspect ratio (default 1.414 for calendar, or template.background.aspectRatio)
    val effectiveAspectRatio = template.background.aspectRatio?.toFloat() ?: 1.414f

    BoxWithConstraints(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(effectiveAspectRatio)
            .background(Color.White, RoundedCornerShape(8.dp))
            .border(1.dp, Color(0xFF334155), RoundedCornerShape(8.dp))
            .clip(RoundedCornerShape(8.dp))
    ) {
        val totalWidth = maxWidth
        val totalHeight = maxHeight

        // Convert percentage layout into Dp
        val photoLeft = totalWidth * (imageLayout.x.toFloat() / 100f)
        val photoTop = totalHeight * (imageLayout.y.toFloat() / 100f)
        val photoWidth = totalWidth * (imageLayout.width.toFloat() / 100f)
        val photoHeight = totalHeight * (imageLayout.height.toFloat() / 100f)

        // Customer Photo Composable (Reusable for either under or above layering)
        val PhotoComposable: @Composable () -> Unit = {
            Box(
                modifier = Modifier
                    .offset(x = photoLeft, y = photoTop)
                    .size(width = photoWidth, height = photoHeight)
                    .clip(polygonClip)
                    .background(Color(0xFF1E293B))
                    .clickable { onPickPhotoClick?.invoke() },
                contentAlignment = Alignment.Center
            ) {
                if (!userImageUrl.isNullOrBlank()) {
                    AsyncImage(
                        model = ImageRequest.Builder(context)
                            .data(resolveAssetUrl(userImageUrl))
                            .crossfade(true)
                            .build(),
                        contentDescription = "Customer Photo",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                        modifier = Modifier.padding(8.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AddPhotoAlternate,
                            contentDescription = "Upload",
                            tint = Color(0xFF94A3B8),
                            modifier = Modifier.size(32.dp)
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Tap to Insert Photo",
                            color = Color(0xFFE2E8F0),
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }
            }
        }

        // Layer 1: Under-artwork Photo
        if (isUnderArtwork) {
            PhotoComposable()
        }

        // Layer 2: Base Artwork Template
        if (template.background.type == "image" && template.background.value.isNotBlank()) {
            AsyncImage(
                model = ImageRequest.Builder(context)
                    .data(resolveAssetUrl(template.background.value))
                    .crossfade(true)
                    .build(),
                contentDescription = template.name,
                contentScale = ContentScale.Fit,
                modifier = Modifier.fillMaxSize()
            )
        }

        // Layer 3: Above-artwork Photo (if selected)
        if (!isUnderArtwork) {
            PhotoComposable()
        }

        // Layer 4: Branding Logo Badge
        template.brandingBadge?.let { badge ->
            if (badge.enabled) {
                val badgeSize = totalWidth * (badge.size.toFloat() / 100f)
                val badgeLeft = (totalWidth * (badge.x.toFloat() / 100f)) - (badgeSize / 2)
                val badgeTop = (totalHeight * (badge.y.toFloat() / 100f)) - (badgeSize / 2)

                Box(
                    modifier = Modifier
                        .offset(x = badgeLeft, y = badgeTop)
                        .size(badgeSize)
                        .clip(if (badge.shape == "circle") CircleShape else RoundedCornerShape(4.dp))
                        .background(Color.White.copy(alpha = 0.9f))
                        .border(1.dp, Color(0xFFCBD5E1), if (badge.shape == "circle") CircleShape else RoundedCornerShape(4.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    if (!logoUrl.isNullOrBlank()) {
                        AsyncImage(
                            model = ImageRequest.Builder(context)
                                .data(resolveAssetUrl(logoUrl))
                                .crossfade(true)
                                .build(),
                            contentDescription = "Company Logo",
                            contentScale = ContentScale.Fit,
                            modifier = Modifier.fillMaxSize().padding(2.dp)
                        )
                    } else {
                        Text(
                            text = "LOGO",
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFF64748B)
                        )
                    }
                }
            }
        }

        // Layer 5: Dynamic Text Slots
        template.textSlots?.forEach { slot ->
            val textLeft = totalWidth * (slot.x.toFloat() / 100f)
            val textTop = totalHeight * (slot.y.toFloat() / 100f)
            val userText = customTexts?.get(slot.id) ?: slot.placeholder

            Text(
                text = userText,
                color = try {
                    Color(android.graphics.Color.parseColor(slot.fontColor))
                } catch (e: Exception) {
                    Color.White
                },
                fontSize = (slot.fontSize * 0.75).sp,
                fontWeight = if (slot.fontWeight == "bold") FontWeight.Bold else FontWeight.Normal,
                modifier = Modifier.offset(x = textLeft, y = textTop)
            )
        }
    }
}
