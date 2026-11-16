package com.printavenue.app.ui.screens

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.printavenue.app.data.model.Product
import com.printavenue.app.ui.components.SheetCanvasRenderer
import com.printavenue.app.ui.components.resolveAssetUrl
import com.printavenue.app.ui.viewmodel.MainViewModel
import java.io.File
import java.io.FileOutputStream

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomizerScreen(
    product: Product,
    viewModel: MainViewModel,
    onNavigateBack: () -> Unit,
    onProceedToCheckout: () -> Unit
) {
    val context = LocalContext.current
    val currentSheetIndex by viewModel.currentSheetIndex.collectAsState()
    val isUploading by viewModel.isUploading.collectAsState()

    val currentSheet = product.sheets.getOrNull(currentSheetIndex) ?: product.sheets.firstOrNull()
    val templates = currentSheet?.templates ?: emptyList()

    val selectedTemplateId = viewModel.selectedTemplates[currentSheetIndex] ?: templates.firstOrNull()?.id ?: ""
    val activeTemplate = templates.find { it.id == selectedTemplateId } ?: templates.firstOrNull()

    val userPhotos by viewModel.userPhotos.collectAsState()
    val currentPhotoUrl = userPhotos[currentSheetIndex]
    val companyName by viewModel.companyName.collectAsState()
    val contactText by viewModel.contactText.collectAsState()
    val logoUrl by viewModel.logoUrl.collectAsState()
    val photoTransforms by viewModel.photoTransforms.collectAsState()
    val globalTextStyle by viewModel.globalTextStyle.collectAsState()
    val slotTextStyles by viewModel.slotTextStyles.collectAsState()

    val currentTransform = photoTransforms[currentSheetIndex] ?: com.printavenue.app.data.model.ImageTransformState()

    // Activity Result Launcher for selecting photo from gallery
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            val file = copyUriToFile(context, it, "photo_${System.currentTimeMillis()}.jpg")
            if (file != null) {
                viewModel.uploadCustomerPhoto(file, currentSheetIndex) { success, msg ->
                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    // Activity Result Launcher for company logo
    val logoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            val file = copyUriToFile(context, it, "logo_${System.currentTimeMillis()}.png")
            if (file != null) {
                viewModel.uploadLogo(file) { success, msg ->
                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = product.title,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = currentSheet?.title ?: "Sheet ${currentSheetIndex + 1}",
                            fontSize = 12.sp,
                            color = Color(0xFFF43F5E)
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Back",
                            tint = Color.White
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0F172A)
                )
            )
        },
        bottomBar = {
            Surface(
                color = Color(0xFF0F172A),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "₹${product.basePrice.toInt()}",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White
                        )
                        Text(
                            text = "GST & Shipping calculated at checkout",
                            fontSize = 10.sp,
                            color = Color(0xFF94A3B8)
                        )
                    }

                    Button(
                        onClick = onProceedToCheckout,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF43F5E)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            text = "Review & Order",
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
        },
        containerColor = Color(0xFF020617)
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Sheet Selector Tabs (Horizontal)
            if (product.sheets.size > 1) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    product.sheets.forEachIndexed { index, sheet ->
                        val isSelected = index == currentSheetIndex
                        val hasPhoto = userPhotos.containsKey(index)

                        FilterChip(
                            selected = isSelected,
                            onClick = { viewModel.setCurrentSheetIndex(index) },
                            label = {
                                Text(
                                    text = sheet.title,
                                    fontSize = 12.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                )
                            },
                            leadingIcon = if (hasPhoto) {
                                {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = "Done",
                                        tint = Color(0xFF10B981),
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            } else null,
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Color(0xFFF43F5E),
                                selectedLabelColor = Color.White,
                                containerColor = Color(0xFF1E293B),
                                labelColor = Color(0xFF94A3B8)
                            )
                        )
                    }
                }
            }

            // Central Interactive Customizer Preview
            if (activeTemplate != null) {
                val customMap = mapOf(
                    "company_name" to companyName,
                    "text_1" to companyName,
                    "contact_text" to contactText,
                    "text_2" to contactText
                )

                SheetCanvasRenderer(
                    template = activeTemplate,
                    sheetTitle = currentSheet?.title ?: "",
                    productCategory = product.category,
                    userImageUrl = currentPhotoUrl,
                    logoUrl = logoUrl,
                    customTexts = customMap,
                    globalTextStyle = globalTextStyle,
                    slotTextStyles = slotTextStyles,
                    imageTransform = currentTransform,
                    onTransformChanged = { scale, x, y ->
                        viewModel.updatePhotoTransform(currentSheetIndex, scale, x, y)
                    },
                    onPickPhotoClick = { photoPickerLauncher.launch("image/*") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // Step 1: Customer Photo Picker Button & Photo Positioning
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "1. Customer Photo Insertion",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        if (!currentPhotoUrl.isNullOrBlank()) {
                            Text(
                                text = "Photo Added",
                                color = Color(0xFF10B981),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = { photoPickerLauncher.launch("image/*") },
                        enabled = !isUploading,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.CloudUpload, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(if (isUploading) "Uploading..." else if (currentPhotoUrl.isNullOrBlank()) "Select & Upload Photo (Gallery)" else "Change Photo (Gallery)")
                    }

                    // Interactive Pinch & Move Controls
                    if (!currentPhotoUrl.isNullOrBlank()) {
                        Spacer(modifier = Modifier.height(12.dp))
                        HorizontalDivider(color = Color(0xFF1E293B))
                        Spacer(modifier = Modifier.height(10.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "Photo Pan & Zoom",
                                color = Color(0xFF94A3B8),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            Text(
                                text = "✋ Pinch or drag photo on canvas",
                                color = Color(0xFFF43F5E),
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedButton(
                                onClick = {
                                    val newScale = maxOf(0.5f, currentTransform.scale - 0.2f)
                                    viewModel.updatePhotoTransform(currentSheetIndex, newScale, currentTransform.offsetX, currentTransform.offsetY)
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                            ) {
                                Text("Zoom -", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }

                            Text(
                                text = "%.1fx".format(currentTransform.scale),
                                color = Color(0xFF38BDF8),
                                fontSize = 12.sp,
                                fontWeight = FontWeight.ExtraBold
                            )

                            OutlinedButton(
                                onClick = {
                                    val newScale = minOf(5.0f, currentTransform.scale + 0.2f)
                                    viewModel.updatePhotoTransform(currentSheetIndex, newScale, currentTransform.offsetX, currentTransform.offsetY)
                                },
                                modifier = Modifier.weight(1f),
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                            ) {
                                Text("Zoom +", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }

                            OutlinedButton(
                                onClick = { viewModel.resetPhotoTransform(currentSheetIndex) },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFCBD5E1))
                            ) {
                                Text("Reset", fontSize = 11.sp)
                            }
                        }
                    }
                }
            }

            // Step 2: Choose Template Variation
            if (templates.size > 1) {
                Card(
                    colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                    shape = RoundedCornerShape(12.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B))
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "2. Design Styles (${templates.size} Available)",
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            templates.forEach { tmpl ->
                                val isSelected = tmpl.id == selectedTemplateId
                                val isArtwork = tmpl.background.type == "image" && tmpl.background.value.isNotBlank()
                                val previewBg = if (!isArtwork && tmpl.background.value.startsWith("#")) {
                                    try {
                                        Color(android.graphics.Color.parseColor(tmpl.background.value))
                                    } catch (e: Exception) {
                                        Color.White
                                    }
                                } else Color.White

                                Box(
                                    modifier = Modifier
                                        .size(105.dp, 125.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(previewBg)
                                        .border(
                                            2.dp,
                                            if (isSelected) Color(0xFFF43F5E) else Color(0xFF334155),
                                            RoundedCornerShape(8.dp)
                                        )
                                        .clickable {
                                            viewModel.selectTemplate(currentSheetIndex, tmpl.id)
                                        }
                                        .padding(4.dp)
                                ) {
                                    if (isArtwork) {
                                        com.printavenue.app.ui.components.SmartArtworkImage(
                                            src = tmpl.background.value,
                                            contentDescription = tmpl.name,
                                            contentScale = ContentScale.Crop,
                                            modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(4.dp))
                                        )
                                    } else {
                                        Column(
                                            modifier = Modifier.fillMaxSize(),
                                            verticalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Box(
                                                modifier = Modifier
                                                    .fillMaxWidth()
                                                    .weight(1f)
                                                    .background(Color(0xFFE2E8F0), RoundedCornerShape(4.dp)),
                                                contentAlignment = Alignment.Center
                                            ) {
                                                Text(
                                                    text = "PHOTO",
                                                    fontSize = 8.sp,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color(0xFF64748B)
                                                )
                                            }
                                            Spacer(modifier = Modifier.height(4.dp))
                                            Text(
                                                text = tmpl.name,
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Medium,
                                                color = Color(0xFF1E293B),
                                                maxLines = 1
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Step 3: Global Branding & Text Inputs
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "3. Personalization & Branding",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = companyName,
                        onValueChange = { viewModel.setCompanyName(it) },
                        label = { Text("Company Name / Greeting") },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFFF43F5E),
                            unfocusedBorderColor = Color(0xFF334155),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = contactText,
                        onValueChange = { viewModel.setContactText(it) },
                        label = { Text("Phone / Slogan / Subtitle") },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Color(0xFFF43F5E),
                            unfocusedBorderColor = Color(0xFF334155),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        ),
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Text Typography, Font, Colour & Size Styling Controls
                    HorizontalDivider(color = Color(0xFF1E293B))
                    Spacer(modifier = Modifier.height(10.dp))

                    Text(
                        text = "Text Styling & Formatting",
                        color = Color(0xFFF43F5E),
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    // 1. Font Family Selector
                    Text(
                        text = "Font Family",
                        color = Color(0xFF94A3B8),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    val fontList = listOf(
                        "Inter" to "Modern",
                        "Poppins" to "Geometric",
                        "Montserrat" to "Clean",
                        "Playfair" to "Luxury Serif",
                        "Lora" to "Editorial",
                        "Great Vibes" to "Calligraphy",
                        "Pacifico" to "Brush",
                        "Roboto Mono" to "Typewriter"
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        fontList.forEach { (fontKey, fontLabel) ->
                            val isSelected = globalTextStyle.fontFamily.equals(fontKey, ignoreCase = true)
                            FilterChip(
                                selected = isSelected,
                                onClick = { viewModel.updateGlobalFontFamily(fontKey) },
                                label = { Text(fontLabel, fontSize = 11.sp) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = Color(0xFFF43F5E),
                                    selectedLabelColor = Color.White,
                                    containerColor = Color(0xFF1E293B),
                                    labelColor = Color(0xFFCBD5E1)
                                )
                            )
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // 2. Font Colour Palette
                    Text(
                        text = "Font Colour",
                        color = Color(0xFF94A3B8),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    val colorPalette = listOf(
                        "#FFFFFF" to Color.White,
                        "#0F172A" to Color(0xFF0F172A),
                        "#F43F5E" to Color(0xFFF43F5E),
                        "#2563EB" to Color(0xFF2563EB),
                        "#10B981" to Color(0xFF10B981),
                        "#F59E0B" to Color(0xFFF59E0B),
                        "#8B5CF6" to Color(0xFF8B5CF6),
                        "#FB7185" to Color(0xFFFB7185)
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .horizontalScroll(rememberScrollState()),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        colorPalette.forEach { (hex, clr) ->
                            val isSelected = globalTextStyle.fontColor.equals(hex, ignoreCase = true)
                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .clip(CircleShape)
                                    .background(clr)
                                    .border(
                                        width = if (isSelected) 3.dp else 1.dp,
                                        color = if (isSelected) Color(0xFF38BDF8) else Color(0xFF475569),
                                        shape = CircleShape
                                    )
                                    .clickable { viewModel.updateGlobalFontColor(hex) },
                                contentAlignment = Alignment.Center
                            ) {
                                if (isSelected) {
                                    Icon(
                                        imageVector = Icons.Default.Check,
                                        contentDescription = "Selected",
                                        tint = if (hex == "#FFFFFF") Color.Black else Color.White,
                                        modifier = Modifier.size(16.dp)
                                    )
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    // 3. Font Style (Bold / Italic) & Size Adjustments
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Bold Toggle
                        FilterChip(
                            selected = globalTextStyle.isBold,
                            onClick = { viewModel.toggleGlobalBold() },
                            label = { Text("Bold", fontWeight = FontWeight.Bold, fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Color(0xFFF43F5E),
                                selectedLabelColor = Color.White,
                                containerColor = Color(0xFF1E293B),
                                labelColor = Color(0xFFCBD5E1)
                            )
                        )

                        // Italic Toggle
                        FilterChip(
                            selected = globalTextStyle.isItalic,
                            onClick = { viewModel.toggleGlobalItalic() },
                            label = { Text("Italic", fontStyle = androidx.compose.ui.text.font.FontStyle.Italic, fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Color(0xFFF43F5E),
                                selectedLabelColor = Color.White,
                                containerColor = Color(0xFF1E293B),
                                labelColor = Color(0xFFCBD5E1)
                            )
                        )

                        Spacer(modifier = Modifier.weight(1f))

                        // Size +/- buttons
                        Text(
                            text = "Size:",
                            color = Color(0xFF94A3B8),
                            fontSize = 11.sp
                        )
                        OutlinedButton(
                            onClick = { viewModel.adjustGlobalFontSize(-2) },
                            modifier = Modifier.size(32.dp),
                            contentPadding = PaddingValues(0.dp),
                            shape = RoundedCornerShape(6.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                        ) {
                            Text("-", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }

                        Text(
                            text = "%+d".format(globalTextStyle.fontSizeDelta),
                            color = Color.White,
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold
                        )

                        OutlinedButton(
                            onClick = { viewModel.adjustGlobalFontSize(2) },
                            modifier = Modifier.size(32.dp),
                            contentPadding = PaddingValues(0.dp),
                            shape = RoundedCornerShape(6.dp),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                        ) {
                            Text("+", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                        }
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedButton(
                        onClick = { logoPickerLauncher.launch("image/*") },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Icon(Icons.Default.Upload, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Upload Brand Logo (Badge Slot)")
                    }
                }
            }
        }
    }
}

// Utility to copy Uri to local temporary file for multipart upload
fun copyUriToFile(context: android.content.Context, uri: Uri, fileName: String): File? {
    return try {
        val inputStream = context.contentResolver.openInputStream(uri) ?: return null
        val file = File(context.cacheDir, fileName)
        val outputStream = FileOutputStream(file)
        inputStream.use { input ->
            outputStream.use { output ->
                input.copyTo(output)
            }
        }
        file
    } catch (e: Exception) {
        e.printStackTrace()
        null
    }
}
