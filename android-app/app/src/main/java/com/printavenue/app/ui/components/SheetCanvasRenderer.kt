package com.printavenue.app.ui.components

import android.graphics.BitmapFactory
import android.util.Base64
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.GenericShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AddPhotoAlternate
import androidx.compose.material.icons.filled.TouchApp
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.Fill
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.printavenue.app.data.model.CustomTextStyle
import com.printavenue.app.data.model.DesignTemplate
import com.printavenue.app.data.model.ImageTransformState

/**
 * Parses coordinate string "0% 0%, 34% 0%, 45% 38%..." into List of normalized Offsets (0..1)
 * Relative to the entire sheet canvas.
 */
fun parsePolygonPoints(raw: String?): List<Offset>? {
    if (raw.isNullOrBlank()) return null
    val parts = raw.split(",").mapNotNull { part ->
        val pieces = part.trim().split("\\s+".toRegex())
        if (pieces.size >= 2) {
            val x = pieces[0].replace("%", "").trim().toFloatOrNull() ?: 0f
            val y = pieces[1].replace("%", "").trim().toFloatOrNull() ?: 0f
            Offset(x / 100f, y / 100f)
        } else null
    }
    return if (parts.size >= 3) parts else null
}

/**
 * Creates an arbitrary polygon GenericShape for Jetpack Compose clipping.
 * When applied to a fillMaxSize() box matching canvas dimensions, this achieves
 * 1:1 pixel fidelity with CSS clip-path: polygon(...) from the Super Admin Template Builder.
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
 * Maps standard font names to Compose FontFamily
 */
fun resolveFontFamily(name: String?): FontFamily {
    val lower = name?.lowercase() ?: ""
    return when {
        lower.contains("serif") || lower.contains("playfair") || lower.contains("lora") || lower.contains("cinzel") || lower.contains("georgia") -> FontFamily.Serif
        lower.contains("mono") || lower.contains("roboto-mono") || lower.contains("courier") -> FontFamily.Monospace
        lower.contains("vibes") || lower.contains("pacifico") || lower.contains("script") || lower.contains("dancing") || lower.contains("caveat") || lower.contains("handwriting") -> FontFamily.Cursive
        else -> FontFamily.SansSerif
    }
}

/**
 * Resolves full server URL for assets like /uploads/...
 */
fun resolveAssetUrl(path: String?): String {
    if (path.isNullOrBlank()) return ""
    if (path.startsWith("http://") || path.startsWith("https://") ||
        path.startsWith("data:") || path.startsWith("content:") ||
        path.startsWith("file:")
    ) {
        return path
    }
    if (path.startsWith("/storage/") || path.startsWith("/data/")) {
        return "file://$path"
    }
    return "https://printavenue.sriddha.com${if (path.startsWith("/")) "" else "/"}$path"
}

/**
 * Image composable supporting base64 data URLs & remote server URLs
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
 * 1. 100% faithful reproduction of polygon cutout placeholders matching Admin Template Builder.
 * 2. Multi-touch pinch-to-zoom and pan/move for all image formats.
 * 3. Dynamic customer font styling: Font Family, Colour, Bold/Italic, and Size.
 * 4. Dual-layer positioning: under-artwork and over-artwork.
 */
@Composable
fun SheetCanvasRenderer(
    template: DesignTemplate,
    sheetTitle: String = "",
    productCategory: String = "calendar",
    userImageUrl: String? = null,
    logoUrl: String? = null,
    customTexts: Map<String, String>? = null,
    globalTextStyle: CustomTextStyle = CustomTextStyle(),
    slotTextStyles: Map<String, CustomTextStyle> = emptyMap(),
    imageTransform: ImageTransformState = ImageTransformState(),
    onTransformChanged: ((scale: Float, offsetX: Float, offsetY: Float) -> Unit)? = null,
    onPickPhotoClick: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
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

    // Polygon points (canvas-relative 0..1)
    val polygonPoints = remember(imageLayout.polygonPoints) {
        parsePolygonPoints(imageLayout.polygonPoints)
    }
    val hasPolygon = imageLayout.shapeType == "polygon" && polygonPoints != null

    val polygonShape = remember(polygonPoints) {
        polygonPoints?.let { createPolygonShape(it) }
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

        // Bounding box coordinates
        val photoLeft = totalWidth * (imageLayout.x.toFloat() / 100f)
        val photoTop = totalHeight * (imageLayout.y.toFloat() / 100f)
        val photoWidth = totalWidth * (imageLayout.width.toFloat() / 100f)
        val photoHeight = totalHeight * (imageLayout.height.toFloat() / 100f)
        val cornerRadius = (imageLayout.borderRadius ?: 8.0).toFloat().dp

        // Pinch / Pan State
        var liveScale by remember(imageTransform.scale) { mutableFloatStateOf(imageTransform.scale) }
        var liveOffsetX by remember(imageTransform.offsetX) { mutableFloatStateOf(imageTransform.offsetX) }
        var liveOffsetY by remember(imageTransform.offsetY) { mutableFloatStateOf(imageTransform.offsetY) }

        // Customer Photo Composable (with full pinch-to-zoom & move across all image formats)
        val RenderCustomerPhoto: @Composable () -> Unit = {
            if (!userImageUrl.isNullOrBlank()) {
                val photoGestureModifier = Modifier.pointerInput(userImageUrl) {
                    detectTransformGestures { _, pan, zoom, _ ->
                        liveScale = (liveScale * zoom).coerceIn(0.5f, 5.0f)
                        liveOffsetX += pan.x
                        liveOffsetY += pan.y
                        onTransformChanged?.invoke(liveScale, liveOffsetX, liveOffsetY)
                    }
                }

                if (hasPolygon && polygonShape != null) {
                    // Full Canvas Polygon Clip for exact match with admin polygon points
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(polygonShape)
                            .background(Color(0xFF0F172A))
                            .then(photoGestureModifier)
                    ) {
                        SmartArtworkImage(
                            src = userImageUrl,
                            contentDescription = "Customer Photo",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxSize()
                                .graphicsLayer {
                                    scaleX = liveScale
                                    scaleY = liveScale
                                    translationX = liveOffsetX
                                    translationY = liveOffsetY
                                }
                        )
                    }
                } else if (imageLayout.shapeType == "circle") {
                    Box(
                        modifier = Modifier
                            .offset(x = photoLeft, y = photoTop)
                            .size(width = photoWidth, height = photoHeight)
                            .clip(CircleShape)
                            .background(Color(0xFF0F172A))
                            .then(photoGestureModifier)
                    ) {
                        SmartArtworkImage(
                            src = userImageUrl,
                            contentDescription = "Customer Photo",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxSize()
                                .graphicsLayer {
                                    scaleX = liveScale
                                    scaleY = liveScale
                                    translationX = liveOffsetX
                                    translationY = liveOffsetY
                                }
                        )
                    }
                } else {
                    // Rectangle with admin configured corner radius
                    Box(
                        modifier = Modifier
                            .offset(x = photoLeft, y = photoTop)
                            .size(width = photoWidth, height = photoHeight)
                            .clip(RoundedCornerShape(cornerRadius))
                            .background(Color(0xFF0F172A))
                            .then(photoGestureModifier)
                    ) {
                        SmartArtworkImage(
                            src = userImageUrl,
                            contentDescription = "Customer Photo",
                            contentScale = ContentScale.Crop,
                            modifier = Modifier
                                .fillMaxSize()
                                .graphicsLayer {
                                    scaleX = liveScale
                                    scaleY = liveScale
                                    translationX = liveOffsetX
                                    translationY = liveOffsetY
                                }
                        )
                    }
                }
            }
        }

        // Exact Placeholder Outline Composable (matches Superadmin/Admin Template Builder)
        val RenderPhotoPlaceholder: @Composable () -> Unit = {
            if (userImageUrl.isNullOrBlank()) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clickable { onPickPhotoClick?.invoke() }
                ) {
                    // 1. Live Dashed Vector Stroke & Translucent Tint
                    Canvas(modifier = Modifier.fillMaxSize()) {
                        val w = size.width
                        val h = size.height
                        val dashedStroke = Stroke(
                            width = 2.5.dp.toPx(),
                            pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 8f), 0f)
                        )

                        if (hasPolygon && polygonPoints != null) {
                            val path = Path().apply {
                                moveTo(polygonPoints[0].x * w, polygonPoints[0].y * h)
                                for (i in 1 until polygonPoints.size) {
                                    lineTo(polygonPoints[i].x * w, polygonPoints[i].y * h)
                                }
                                close()
                            }
                            // Fill matching admin rgba(244, 63, 94, 0.18)
                            drawPath(path, color = Color(0x30F43F5E), style = Fill)
                            // Dashed stroke matching admin #F43F5E
                            drawPath(path, color = Color(0xFFF43F5E), style = dashedStroke)
                        } else if (imageLayout.shapeType == "circle") {
                            val leftPx = (imageLayout.x.toFloat() / 100f) * w
                            val topPx = (imageLayout.y.toFloat() / 100f) * h
                            val widthPx = (imageLayout.width.toFloat() / 100f) * w
                            val heightPx = (imageLayout.height.toFloat() / 100f) * h
                            val center = Offset(leftPx + widthPx / 2f, topPx + heightPx / 2f)
                            val radius = minOf(widthPx, heightPx) / 2f

                            drawCircle(color = Color(0x30F43F5E), radius = radius, center = center, style = Fill)
                            drawCircle(color = Color(0xFFF43F5E), radius = radius, center = center, style = dashedStroke)
                        } else {
                            val leftPx = (imageLayout.x.toFloat() / 100f) * w
                            val topPx = (imageLayout.y.toFloat() / 100f) * h
                            val widthPx = (imageLayout.width.toFloat() / 100f) * w
                            val heightPx = (imageLayout.height.toFloat() / 100f) * h
                            val cornerRadiusPx = cornerRadius.toPx()

                            val roundRect = RoundRect(
                                rect = Rect(leftPx, topPx, leftPx + widthPx, topPx + heightPx),
                                radiusX = cornerRadiusPx,
                                radiusY = cornerRadiusPx
                            )
                            val path = Path().apply { addRoundRect(roundRect) }
                            drawPath(path, color = Color(0x30F43F5E), style = Fill)
                            drawPath(path, color = Color(0xFFF43F5E), style = dashedStroke)
                        }
                    }

                    // 2. Centered Placeholder Content within bounding box
                    Column(
                        modifier = Modifier
                            .offset(x = photoLeft, y = photoTop)
                            .size(width = photoWidth, height = photoHeight)
                            .padding(4.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
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
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(1.dp))
                        Text(
                            text = "Tap to choose photo",
                            color = Color(0xFFE11D48),
                            fontSize = 7.sp,
                            fontWeight = FontWeight.Medium,
                            textAlign = TextAlign.Center
                        )
                    }
                }
            }
        }

        // Layer 1: Under-artwork Photo (if layerPosition == "under-artwork")
        if (isUnderArtwork) {
            RenderCustomerPhoto()
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

        // Layer 3: Above-artwork Photo (if layerPosition != "under-artwork")
        if (!isUnderArtwork) {
            RenderCustomerPhoto()
        }

        // Photo Placeholder Cutout Indicator (Always clearly visible to guide customer)
        RenderPhotoPlaceholder()

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

        // Layer 5: Branding Logo Slot
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

        // Layer 6: Dynamic Text Slots with Customer Font, Colour, Style, Size Overrides
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

                // Look for per-slot style override or fallback to global custom style
                val customStyle = slotTextStyles[slot.id] ?: globalTextStyle

                val chosenFontFamily = resolveFontFamily(customStyle.fontFamily)
                val chosenColor = try {
                    Color(android.graphics.Color.parseColor(customStyle.fontColor))
                } catch (e: Exception) {
                    try {
                        Color(android.graphics.Color.parseColor(slot.fontColor ?: "#ffffff"))
                    } catch (e2: Exception) {
                        Color.White
                    }
                }

                val finalFontSize = maxOf(8, (slot.fontSize * 0.75).toInt() + customStyle.fontSizeDelta).sp
                val fontWeight = if (customStyle.isBold) FontWeight.Bold else FontWeight.Normal
                val fontStyle = if (customStyle.isItalic) FontStyle.Italic else FontStyle.Normal

                Text(
                    text = userText,
                    color = chosenColor,
                    fontSize = finalFontSize,
                    fontFamily = chosenFontFamily,
                    fontWeight = fontWeight,
                    fontStyle = fontStyle,
                    modifier = Modifier.offset(x = textLeft, y = textTop)
                )
            }
        } else {
            // Fallback for standard templates without multi-text slots: show company name at bottom
            val brandGreeting = customTexts?.get("company_name")?.takeIf { it.isNotBlank() }
                ?: template.textOverlay?.defaultText?.takeIf { it.isNotBlank() }
            if (!brandGreeting.isNullOrBlank()) {
                val chosenFontFamily = resolveFontFamily(globalTextStyle.fontFamily)
                val chosenColor = try {
                    Color(android.graphics.Color.parseColor(globalTextStyle.fontColor))
                } catch (e: Exception) {
                    if (template.background.type == "color" && template.background.value.startsWith("#FAFA")) Color(0xFF1E293B) else Color.White
                }
                val finalFontSize = maxOf(10, 13 + globalTextStyle.fontSizeDelta).sp
                val fontWeight = if (globalTextStyle.isBold) FontWeight.Bold else FontWeight.Normal
                val fontStyle = if (globalTextStyle.isItalic) FontStyle.Italic else FontStyle.Normal

                Text(
                    text = brandGreeting,
                    color = chosenColor,
                    fontSize = finalFontSize,
                    fontFamily = chosenFontFamily,
                    fontWeight = fontWeight,
                    fontStyle = fontStyle,
                    modifier = Modifier
                        .align(Alignment.BottomCenter)
                        .padding(bottom = 12.dp)
                )
            }
        }
    }
}
