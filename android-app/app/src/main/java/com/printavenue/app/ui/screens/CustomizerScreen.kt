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

    val currentPhotoUrl = viewModel.userPhotos[currentSheetIndex]
    val companyName by viewModel.companyName.collectAsState()
    val contactText by viewModel.contactText.collectAsState()
    val logoUrl by viewModel.logoUrl.collectAsState()

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
                        val hasPhoto = viewModel.userPhotos.containsKey(index)

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
                    onPickPhotoClick = { photoPickerLauncher.launch("image/*") },
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // Step 1: Customer Photo Picker Button
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF1E293B))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "1. Customer Photo Insertion",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
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
                        Text(if (isUploading) "Uploading..." else "Select & Upload Photo (Gallery)")
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
