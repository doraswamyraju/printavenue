package com.printavenue.app.ui.components

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.GenericShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.printavenue.app.data.model.DesignTemplate

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
    return if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
        path
    } else {
        "https://printavenue.sriddha.com${if (path.startsWith("/")) "" else "/"}$path"
    }
}

/**
 * Robust Image composable supporting:
 * - base64 data URLs ("data:image/png;base64,...")
 * - remote server URLs ("https://... /uploads/...")
 */
@Composable
fun SmartArtworkImage(
    src: String,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    contentScale: ContentScale = ContentScale.Fit
) {
    val context = LocalContext.current
    if (src.startsWith("data:image")) {
        val bitmap = remember(src) {
            try {
                val base64Data = src.substringAfter("base64,")
                val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
                BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)?.asImageBitmap()
            } catch (e: Exception) {
                null
            }
        }
        if (bitmap != null) {
            androidx.compose.foundation.Image(
                bitmap = bitmap,
                contentDescription = contentDescription,
                contentScale = contentScale,
                modifier = modifier
            )
        }
    } else {
        AsyncImage(
            model = ImageRequest.Builder(context)
                .data(resolveAssetUrl(src))
                .crossfade(true)
                .build(),
            contentDescription = contentDescription,
            contentScale = contentScale,
            modifier = modifier
        )
    }
}

/**
 * SheetCanvasRenderer is the native Jetpack Compose replica of SheetRenderer.tsx:
 * 1. Supports base64 data URLs as well as server URLs.
 * 2. Honors color backgrounds and image artwork backgrounds.
 * 3. Shows photo placeholder cutout & calendar grid.
 * 4. Dual-layer positioning: under-artwork and above-artwork.
 */
@Composable
fun SheetCanvasRenderer(
    template: DesignTemplate,
    sheetTitle: String = "",
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
    val isImageArtwork = template.background.type == "image" && template.background.value.isNotBlank()
    val bgColor = remember(template.background.value) {
        if (!isImageArtwork && template.background.value.startsWith("#")) {
            try {
                Color(android.graphics.Color.parseColor(template.background.value))
            } catch (e: Exception) {
                Color.White
            }
        } else Color.White
    }

    // Parse polygon points
    val points = remember(imageLayout.polygonPoints) {
        parsePolygonPoints(imageLayout.polygonPoints)
    }
    val polygonClip = remember(points) {
        createPolygonShape(points)
    }

    // Natural aspect ratio (priority: template background aspectRatio, or default 1.414)
    val effectiveAspectRatio = template.background.aspectRatio?.toFloat() ?: 1.414f

    BoxWithConstraints(
        modifier = modifier
            .fillMaxWidth()
            .aspectRatio(effectiveAspectRatio)
            .background(bgColor, RoundedCornerShape(8.dp))
            .border(1.dp, Color(0xFF334155), RoundedCornerShape(8.dp))
            .clip(RoundedCornerShape(8.dp))
    ) {
        val totalWidth = maxWidth
        val totalHeight = maxHeight

        val photoLeft = totalWidth * (imageLayout.x.toFloat() / 100f)
        val photoTop = totalHeight * (imageLayout.y.toFloat() / 100f)
        val photoWidth = totalWidth * (imageLayout.width.toFloat() / 100f)
        val photoHeight = totalHeight * (imageLayout.height.toFloat() / 100f)

        // Customer Photo Composable
        val PhotoComposable: @Composable () -> Unit = {
            Box(
                modifier = Modifier
                    .offset(x = photoLeft, y = photoTop)
                    .size(width = photoWidth, height = photoHeight)
                    .clip(polygonClip)
                    .background(if (userImageUrl.isNullOrBlank()) Color(0xFFFFF1F2) else Color(0xFF1E293B))
                    .border(
                        if (userImageUrl.isNullOrBlank()) 1.5.dp else 0.dp,
                        if (userImageUrl.isNullOrBlank()) Color(0xFFFB7185) else Color.Transparent,
                        polygonClip
                    )
                    .clickable { onPickPhotoClick?.invoke() },
                contentAlignment = Alignment.Center
            ) {
                if (!userImageUrl.isNullOrBlank()) {
                    SmartArtworkImage(
                        src = userImageUrl,
                        contentDescription = "Customer Photo",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                } else {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                        modifier = Modifier.padding(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.AddPhotoAlternate,
                            contentDescription = "Upload",
                            tint = Color(0xFFF43F5E),
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "PHOTO PLACEHOLDER",
                            color = Color(0xFFBE123C),
                            fontSize = 8.sp,
                            fontWeight = FontWeight.Black,
                            textAlign = TextAlign.Center
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
        if (isImageArtwork) {
            SmartArtworkImage(
                src = template.background.value,
                contentDescription = template.name,
                contentScale = ContentScale.FillBounds,
                modifier = Modifier.fillMaxSize()
            )
        }

        // Layer 3: Above-artwork Photo
        if (!isUnderArtwork) {
            PhotoComposable()
        }

        // Layer 4: Simulated Calendar Grid if applicable
        template.calendarLayout?.let { cal ->
            if (cal.width > 0 && cal.height > 0) {
                val calLeft = totalWidth * (cal.x.toFloat() / 100f)
                val calTop = totalHeight * (cal.y.toFloat() / 100f)
                val calW = totalWidth * (cal.width.toFloat() / 100f)
                val calH = totalHeight * (cal.height.toFloat() / 100f)

                Column(
                    modifier = Modifier
                        .offset(x = calLeft, y = calTop)
                        .size(calW, calH)
                        .padding(4.dp)
                ) {
                    Text(
                        text = if (sheetTitle.isNotBlank()) sheetTitle.uppercase() else "2027",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (cal.theme == "light") Color(0xFF334155) else Color(0xFF0F172A)
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "S  M  T  W  T  F  S",
                        fontSize = 7.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color(0xFFE11D48)
                    )
                    Text(
                        text = " 1  2  3  4  5  6  7\n 8  9 10 11 12 13 14\n15 16 17 18 19 20 21\n22 23 24 25 26 27 28",
                        fontSize = 7.sp,
                        lineHeight = 9.sp,
                        color = if (cal.theme == "light") Color(0xFF475569) else Color(0xFF1E293B)
                    )
                }
            }
        }

        // Layer 5: Branding Logo Slot (Supports both template.logoSlot and template.brandingBadge)
        val activeLogoSlot = template.logoSlot ?: template.brandingBadge?.let {
            com.printavenue.app.data.model.LogoSlot(
                enabled = it.enabled,
                x = it.x,
                y = it.y,
                width = it.size,
                height = it.size,
                shape = it.shape
            )
        }

        if (activeLogoSlot != null && activeLogoSlot.enabled) {
            val isCircle = activeLogoSlot.shape == "circle"
            val badgeWidth = totalWidth * (activeLogoSlot.width.toFloat() / 100f)
            val badgeHeight = if (isCircle) badgeWidth else totalHeight * (activeLogoSlot.height.toFloat() / 100f)
            val badgeLeft = totalWidth * (activeLogoSlot.x.toFloat() / 100f)
            val badgeTop = totalHeight * (activeLogoSlot.y.toFloat() / 100f)

            Box(
                modifier = Modifier
                    .offset(x = badgeLeft, y = badgeTop)
                    .size(width = badgeWidth, height = badgeHeight)
                    .clip(if (isCircle) CircleShape else RoundedCornerShape(4.dp))
                    .background(Color.White.copy(alpha = 0.95f))
                    .border(1.dp, Color(0xFFCBD5E1), if (isCircle) CircleShape else RoundedCornerShape(4.dp)),
                contentAlignment = Alignment.Center
            ) {
                if (!logoUrl.isNullOrBlank()) {
                    SmartArtworkImage(
                        src = logoUrl,
                        contentDescription = "Logo",
                        contentScale = ContentScale.Fit,
                        modifier = Modifier.fillMaxSize().padding(2.dp)
                    )
                } else {
                    Text(
                        text = "LOGO",
                        fontSize = 8.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF64748B)
                    )
                }
            }
        }

        // Layer 6: Dynamic Text Slots (e.g. Company Name, Tagline, Greetings)
        val textSlotsToRender = template.textSlots?.filter { it.enabled }
        if (!textSlotsToRender.isNullOrEmpty()) {
            textSlotsToRender.forEach { slot ->
                val textLeft = totalWidth * (slot.x.toFloat() / 100f)
                val textTop = totalHeight * (slot.y.toFloat() / 100f)

                val userText = customTexts?.get(slot.id)
                    ?.takeIf { it.isNotBlank() }
                    ?: customTexts?.get("company_name")?.takeIf { it.isNotBlank() && (slot.id.contains("1") || slot.id.contains("company")) }
                    ?: customTexts?.get("contact_text")?.takeIf { it.isNotBlank() && (slot.id.contains("2") || slot.id.contains("contact")) }
                    ?: slot.defaultText
                    ?: slot.placeholder
                    ?: slot.label

                val textColor = try {
                    if (!slot.fontColor.isNullOrBlank()) {
                        Color(android.graphics.Color.parseColor(slot.fontColor))
                    } else Color.White
                } catch (e: Exception) {
                    Color.White
                }

                Text(
                    text = userText,
                    color = textColor,
                    fontSize = (slot.fontSize * 0.75).sp,
                    fontWeight = if (slot.fontWeight == "bold") FontWeight.Bold else FontWeight.Normal,
                    modifier = Modifier.offset(x = textLeft, y = textTop)
                )
            }
        } else {
            // Fallback for standard templates without multi-text slots: show company name at bottom
            val brandGreeting = customTexts?.get("company_name")?.takeIf { it.isNotBlank() }
                ?: template.textOverlay?.defaultText?.takeIf { it.isNotBlank() }
            if (!brandGreeting.isNullOrBlank()) {
                val posX = template.textOverlay?.position?.x?.toFloat() ?: 50f
                val posY = template.textOverlay?.position?.y?.toFloat() ?: 88f
                Text(
                    text = brandGreeting,
                    color = if (template.background.type == "color" && template.background.value.startsWith("#FAFA")) Color(0xFF1E293B) else Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 12.dp)
                )
            }
        }
    }
}
