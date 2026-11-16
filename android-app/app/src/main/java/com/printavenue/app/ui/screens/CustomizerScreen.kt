package com.printavenue.app.ui.screens

import android.net.Uri
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material.icons.automirrored.filled.*
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
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.printavenue.app.data.model.Product
import com.printavenue.app.ui.components.SheetCanvasRenderer
import com.printavenue.app.ui.components.SmartArtworkImage
import com.printavenue.app.ui.viewmodel.MainViewModel
import java.io.File
import java.io.FileOutputStream

enum class CustomizerTab {
    PHOTO, TEXT, BRAND, TEMPLATES
}

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

    var selectedTab by remember { mutableStateOf(CustomizerTab.PHOTO) }
    var showProofModal by remember { mutableStateOf(false) }

    // Launcher for selecting photo from gallery
    val photoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let {
            val file = copyUriToFile(context, it, "photo_${System.currentTimeMillis()}.jpg")
            if (file != null) {
                viewModel.uploadCustomerPhoto(file, currentSheetIndex) { success, msg ->
                    Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()
                }
            } else {
                viewModel.setCustomerPhoto(currentSheetIndex, it.toString())
            }
        }
    }

    // Launcher for company logo
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

    // Fullscreen High-Resolution Proofing Modal
    if (showProofModal && activeTemplate != null) {
        Dialog(
            onDismissRequest = { showProofModal = false },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF020617))
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
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
                    modifier = Modifier.fillMaxWidth()
                )

                IconButton(
                    onClick = { showProofModal = false },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(16.dp)
                        .background(Color(0x80000000), CircleShape)
                ) {
                    Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.White)
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
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                        Text(
                            text = "${currentSheet?.title ?: "Sheet ${currentSheetIndex + 1}"} • Sheet ${currentSheetIndex + 1}/${product.sheets.size}",
                            fontSize = 11.sp,
                            color = Color(0xFFF43F5E),
                            fontWeight = FontWeight.SemiBold
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
                actions = {
                    IconButton(onClick = { showProofModal = true }) {
                        Icon(
                            imageVector = Icons.Default.Fullscreen,
                            contentDescription = "Fullscreen Proof",
                            tint = Color(0xFF38BDF8)
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
                border = BorderStroke(1.dp, Color(0xFF1E293B))
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    val totalSheets = product.sheets.size
                    val completedSheets = product.sheets.indices.count { userPhotos.containsKey(it) }
                    val isAllCompleted = completedSheets >= totalSheets

                    Column {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = "₹${product.basePrice.toInt()}",
                                fontSize = 19.sp,
                                fontWeight = FontWeight.ExtraBold,
                                color = Color.White
                            )
                            Surface(
                                shape = RoundedCornerShape(4.dp),
                                color = if (isAllCompleted) Color(0xFF065F46) else Color(0xFF1E293B)
                            ) {
                                Text(
                                    text = "$completedSheets/$totalSheets Photos",
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isAllCompleted) Color(0xFF34D399) else Color(0xFF94A3B8),
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Text(
                            text = "GST & Shipping calculated at checkout",
                            fontSize = 10.sp,
                            color = Color(0xFF64748B)
                        )
                    }

                    Button(
                        onClick = onProceedToCheckout,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF43F5E)),
                        shape = RoundedCornerShape(10.dp),
                        contentPadding = PaddingValues(horizontal = 18.dp, vertical = 10.dp)
                    ) {
                        Text(
                            text = "Review & Order →",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
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
        ) {
            // 1. PINNED SHEET FILMSTRIP (Instant 1-tap Month Navigation)
            if (product.sheets.size > 1) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color(0xFF0B132B))
                        .horizontalScroll(rememberScrollState())
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    product.sheets.forEachIndexed { index, sheet ->
                        val isSelected = index == currentSheetIndex
                        val hasPhoto = userPhotos.containsKey(index)

                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = if (isSelected) Color(0xFFF43F5E) else if (hasPhoto) Color(0xFF1E293B) else Color(0xFF090D16),
                            border = BorderStroke(
                                width = if (isSelected) 1.5.dp else 1.dp,
                                color = if (isSelected) Color.White else if (hasPhoto) Color(0xFF10B981).copy(alpha = 0.6f) else Color(0xFF334155)
                            ),
                            modifier = Modifier.clickable { viewModel.setCurrentSheetIndex(index) }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(5.dp)
                            ) {
                                if (hasPhoto) {
                                    Icon(
                                        imageVector = Icons.Default.CheckCircle,
                                        contentDescription = "Uploaded",
                                        tint = if (isSelected) Color.White else Color(0xFF10B981),
                                        modifier = Modifier.size(13.dp)
                                    )
                                } else {
                                    Box(
                                        modifier = Modifier
                                            .size(7.dp)
                                            .clip(CircleShape)
                                            .background(if (isSelected) Color.White else Color(0xFFF43F5E))
                                    )
                                }
                                Text(
                                    text = sheet.title,
                                    fontSize = 11.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) Color.White else if (hasPhoto) Color(0xFFF1F5F9) else Color(0xFF94A3B8)
                                )
                            }
                        }
                    }
                }
            }

            // 2. PINNED VISUAL CANVAS VIEWPORT (Never scrolls off-screen; gesture-pure)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1.05f)
                    .background(Color(0xFF020617))
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                contentAlignment = Alignment.Center
            ) {
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
                        modifier = Modifier
                            .fillMaxSize()
                    )

                    // Floating Canvas Overlay: Pinch/Drag Tip Pill
                    Row(
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .padding(6.dp)
                            .background(Color(0xCC0F172A), RoundedCornerShape(12.dp))
                            .border(1.dp, Color(0xFF334155), RoundedCornerShape(12.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.TouchApp,
                            contentDescription = null,
                            tint = Color(0xFF38BDF8),
                            modifier = Modifier.size(11.dp)
                        )
                        Text(
                            text = if (currentPhotoUrl.isNullOrBlank()) "Tap placeholder to add photo" else "Pinch & drag photo",
                            color = Color(0xFF94A3B8),
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium
                        )
                    }

                    // Floating Proofing Button (Top Right)
                    Surface(
                        shape = CircleShape,
                        color = Color(0xCC0F172A),
                        border = BorderStroke(1.dp, Color(0xFF334155)),
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(6.dp)
                            .clickable { showProofModal = true }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Fullscreen,
                            contentDescription = "Full Preview",
                            tint = Color.White,
                            modifier = Modifier.padding(6.dp).size(16.dp)
                        )
                    }
                }
            }

            // 3. SEGMENTED INTERACTIVE TOOL DECK (Bottom Half with Tabs)
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(0.95f)
                    .background(
                        Color(0xFF0F172A),
                        RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp)
                    )
                    .border(
                        1.dp,
                        Color(0xFF1E293B),
                        RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp)
                    )
            ) {
                // Segmented Tool Tab Row
                TabRow(
                    selectedTabIndex = selectedTab.ordinal,
                    containerColor = Color.Transparent,
                    contentColor = Color(0xFFF43F5E),
                    divider = { HorizontalDivider(color = Color(0xFF1E293B)) }
                ) {
                    Tab(
                        selected = selectedTab == CustomizerTab.PHOTO,
                        onClick = { selectedTab = CustomizerTab.PHOTO },
                        icon = { Icon(Icons.Default.PhotoCamera, contentDescription = null, modifier = Modifier.size(17.dp)) },
                        text = { Text("Photo", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = selectedTab == CustomizerTab.TEXT,
                        onClick = { selectedTab = CustomizerTab.TEXT },
                        icon = { Icon(Icons.Default.TextFields, contentDescription = null, modifier = Modifier.size(17.dp)) },
                        text = { Text("Text", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = selectedTab == CustomizerTab.BRAND,
                        onClick = { selectedTab = CustomizerTab.BRAND },
                        icon = { Icon(Icons.Default.Verified, contentDescription = null, modifier = Modifier.size(17.dp)) },
                        text = { Text("Brand", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    )
                    Tab(
                        selected = selectedTab == CustomizerTab.TEMPLATES,
                        onClick = { selectedTab = CustomizerTab.TEMPLATES },
                        icon = { Icon(Icons.Default.Layers, contentDescription = null, modifier = Modifier.size(17.dp)) },
                        text = { Text("Layout", fontSize = 11.sp, fontWeight = FontWeight.Bold) }
                    )
                }

                // Active Tool Content (Scrollable within bottom deck)
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    when (selectedTab) {
                        CustomizerTab.PHOTO -> {
                            // Primary Upload / Change Photo Button
                            Button(
                                onClick = { photoPickerLauncher.launch("image/*") },
                                enabled = !isUploading,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (currentPhotoUrl.isNullOrBlank()) Color(0xFF2563EB) else Color(0xFF334155)
                                ),
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Icon(Icons.Default.CloudUpload, contentDescription = null, modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    text = if (isUploading) "Uploading..." else if (currentPhotoUrl.isNullOrBlank()) "Select Photo from Gallery" else "Replace Photo (Gallery)",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            if (!currentPhotoUrl.isNullOrBlank()) {
                                // Zoom Row (- / Readout / + / Reset)
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
                                        Icon(Icons.Default.ZoomOut, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Zoom -", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }

                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = Color(0xFF1E293B),
                                        border = BorderStroke(1.dp, Color(0xFF334155))
                                    ) {
                                        Text(
                                            text = "%.1fx".format(currentTransform.scale),
                                            color = Color(0xFF38BDF8),
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.ExtraBold,
                                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
                                        )
                                    }

                                    OutlinedButton(
                                        onClick = {
                                            val newScale = minOf(5.0f, currentTransform.scale + 0.2f)
                                            viewModel.updatePhotoTransform(currentSheetIndex, newScale, currentTransform.offsetX, currentTransform.offsetY)
                                        },
                                        modifier = Modifier.weight(1f),
                                        shape = RoundedCornerShape(8.dp),
                                        colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                                    ) {
                                        Icon(Icons.Default.ZoomIn, contentDescription = null, modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
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

                                // Micro-Nudge D-Pad Row for fine positioning
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        text = "Nudge Position",
                                        color = Color(0xFF94A3B8),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.SemiBold
                                    )

                                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        OutlinedButton(
                                            onClick = { viewModel.nudgePhoto(currentSheetIndex, -15f, 0f) },
                                            modifier = Modifier.size(34.dp),
                                            contentPadding = PaddingValues(0.dp),
                                            shape = RoundedCornerShape(6.dp),
                                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                                        ) {
                                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Left", modifier = Modifier.size(14.dp))
                                        }

                                        OutlinedButton(
                                            onClick = { viewModel.nudgePhoto(currentSheetIndex, 0f, -15f) },
                                            modifier = Modifier.size(34.dp),
                                            contentPadding = PaddingValues(0.dp),
                                            shape = RoundedCornerShape(6.dp),
                                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                                        ) {
                                            Icon(Icons.Default.ArrowUpward, contentDescription = "Up", modifier = Modifier.size(14.dp))
                                        }

                                        OutlinedButton(
                                            onClick = { viewModel.nudgePhoto(currentSheetIndex, 0f, 15f) },
                                            modifier = Modifier.size(34.dp),
                                            contentPadding = PaddingValues(0.dp),
                                            shape = RoundedCornerShape(6.dp),
                                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                                        ) {
                                            Icon(Icons.Default.ArrowDownward, contentDescription = "Down", modifier = Modifier.size(14.dp))
                                        }

                                        OutlinedButton(
                                            onClick = { viewModel.nudgePhoto(currentSheetIndex, 15f, 0f) },
                                            modifier = Modifier.size(34.dp),
                                            contentPadding = PaddingValues(0.dp),
                                            shape = RoundedCornerShape(6.dp),
                                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                                        ) {
                                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = "Right", modifier = Modifier.size(14.dp))
                                        }
                                    }

                                    // Remove Photo
                                    IconButton(
                                        onClick = { viewModel.removeCustomerPhoto(currentSheetIndex) },
                                        modifier = Modifier.size(34.dp)
                                    ) {
                                        Icon(Icons.Default.DeleteOutline, contentDescription = "Remove Photo", tint = Color(0xFFEF4444), modifier = Modifier.size(18.dp))
                                    }
                                }
                            }
                        }

                        CustomizerTab.TEXT -> {
                            // Text Inputs
                            OutlinedTextField(
                                value = companyName,
                                onValueChange = { viewModel.setCompanyName(it) },
                                label = { Text("Company Name / Greeting Title", fontSize = 12.sp) },
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFFF43F5E),
                                    unfocusedBorderColor = Color(0xFF334155),
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )

                            OutlinedTextField(
                                value = contactText,
                                onValueChange = { viewModel.setContactText(it) },
                                label = { Text("Phone / Slogan / Contact Info", fontSize = 12.sp) },
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color(0xFFF43F5E),
                                    unfocusedBorderColor = Color(0xFF334155),
                                    focusedTextColor = Color.White,
                                    unfocusedTextColor = Color.White
                                ),
                                modifier = Modifier.fillMaxWidth()
                            )

                            // Font Family Chips
                            Text(
                                text = "Font Family",
                                color = Color(0xFF94A3B8),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                            val fontList = listOf(
                                "Inter" to "Modern",
                                "Playfair" to "Luxury Serif",
                                "Montserrat" to "Clean",
                                "Poppins" to "Geometric",
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
                                        label = { Text(fontLabel, fontSize = 10.sp) },
                                        colors = FilterChipDefaults.filterChipColors(
                                            selectedContainerColor = Color(0xFFF43F5E),
                                            selectedLabelColor = Color.White,
                                            containerColor = Color(0xFF1E293B),
                                            labelColor = Color(0xFFCBD5E1)
                                        )
                                    )
                                }
                            }

                            // Font Color Swatches
                            Text(
                                text = "Font Colour",
                                color = Color(0xFF94A3B8),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.SemiBold
                            )
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
                                            .size(28.dp)
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
                                                modifier = Modifier.size(14.dp)
                                            )
                                        }
                                    }
                                }
                            }

                            // Bold, Italic & Size Row
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
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

                                Text("Size:", color = Color(0xFF94A3B8), fontSize = 11.sp)
                                OutlinedButton(
                                    onClick = { viewModel.adjustGlobalFontSize(-2) },
                                    modifier = Modifier.size(30.dp),
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
                                    modifier = Modifier.size(30.dp),
                                    contentPadding = PaddingValues(0.dp),
                                    shape = RoundedCornerShape(6.dp),
                                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
                                ) {
                                    Text("+", fontSize = 14.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }

                        CustomizerTab.BRAND -> {
                            // Logo Slot Card
                            Card(
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Box(
                                            modifier = Modifier
                                                .size(44.dp)
                                                .clip(RoundedCornerShape(8.dp))
                                                .background(Color.White)
                                                .border(1.dp, Color(0xFF334155), RoundedCornerShape(8.dp)),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            val currentLogo = logoUrl
                                            if (!currentLogo.isNullOrBlank()) {
                                                SmartArtworkImage(
                                                    src = currentLogo,
                                                    contentDescription = "Brand Logo",
                                                    contentScale = ContentScale.Fit,
                                                    modifier = Modifier.fillMaxSize().padding(2.dp)
                                                )
                                            } else {
                                                Icon(Icons.Default.Verified, contentDescription = null, tint = Color(0xFF94A3B8), modifier = Modifier.size(24.dp))
                                            }
                                        }

                                        Column {
                                            Text("Brand Logo Badge", color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.Bold)
                                            Text(
                                                text = if (!logoUrl.isNullOrBlank()) "Logo applied across all sheets" else "Displays on logo badge slot",
                                                color = if (!logoUrl.isNullOrBlank()) Color(0xFF10B981) else Color(0xFF94A3B8),
                                                fontSize = 10.sp
                                            )
                                        }
                                    }

                                    Button(
                                        onClick = { logoPickerLauncher.launch("image/*") },
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB)),
                                        shape = RoundedCornerShape(8.dp),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Text(if (logoUrl.isNullOrBlank()) "Upload" else "Change", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }

                            Text(
                                text = "💡 Your brand logo and company text automatically appear on all 12 monthly calendar sheets and cover.",
                                color = Color(0xFF64748B),
                                fontSize = 11.sp,
                                lineHeight = 15.sp
                            )
                        }

                        CustomizerTab.TEMPLATES -> {
                            Text(
                                text = "Choose Layout Style for ${currentSheet?.title ?: "Sheet"}",
                                color = Color.White,
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp
                            )

                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .horizontalScroll(rememberScrollState()),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
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
                                            .size(95.dp, 115.dp)
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
                                            .padding(3.dp)
                                    ) {
                                        if (isArtwork) {
                                            SmartArtworkImage(
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
                                                Spacer(modifier = Modifier.height(3.dp))
                                                Text(
                                                    text = tmpl.name,
                                                    fontSize = 8.sp,
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
