package com.printavenue.app.ui.viewmodel

import androidx.compose.runtime.mutableStateMapOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.printavenue.app.data.api.PrintAvenueApiService
import com.printavenue.app.data.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

sealed interface ProductsUiState {
    object Loading : ProductsUiState
    data class Success(val products: List<Product>) : ProductsUiState
    data class Error(val message: String) : ProductsUiState
}

class MainViewModel : ViewModel() {

    private val api = PrintAvenueApiService.create()

    private val _productsState = MutableStateFlow<ProductsUiState>(ProductsUiState.Loading)
    val productsState: StateFlow<ProductsUiState> = _productsState

    private val _currentSheetIndex = MutableStateFlow(0)
    val currentSheetIndex: StateFlow<Int> = _currentSheetIndex

    private val _isUploading = MutableStateFlow(false)
    val isUploading: StateFlow<Boolean> = _isUploading

    // Sheet customizer state
    val selectedTemplates = mutableStateMapOf<Int, String>()
    private val _userPhotos = MutableStateFlow<Map<Int, String>>(emptyMap())
    val userPhotos: StateFlow<Map<Int, String>> = _userPhotos

    private val _companyName = MutableStateFlow("")
    val companyName: StateFlow<String> = _companyName

    private val _contactText = MutableStateFlow("")
    val contactText: StateFlow<String> = _contactText

    private val _logoUrl = MutableStateFlow<String?>(null)
    val logoUrl: StateFlow<String?> = _logoUrl

    // Per-sheet Photo Transformation (Pinch, Zoom, Move)
    private val _photoTransforms = MutableStateFlow<Map<Int, ImageTransformState>>(emptyMap())
    val photoTransforms: StateFlow<Map<Int, ImageTransformState>> = _photoTransforms

    // Custom Text Styles (Font, Color, Bold, Italic, Size)
    private val _globalTextStyle = MutableStateFlow(CustomTextStyle())
    val globalTextStyle: StateFlow<CustomTextStyle> = _globalTextStyle

    private val _slotTextStyles = MutableStateFlow<Map<String, CustomTextStyle>>(emptyMap())
    val slotTextStyles: StateFlow<Map<String, CustomTextStyle>> = _slotTextStyles

    init {
        fetchProducts()
    }

    fun fetchProducts() {
        viewModelScope.launch {
            _productsState.value = ProductsUiState.Loading
            try {
                val resp = api.getProducts()
                _productsState.value = ProductsUiState.Success(resp.products)
            } catch (e: Exception) {
                _productsState.value = ProductsUiState.Error(e.localizedMessage ?: "Failed to load products")
            }
        }
    }

    fun setCurrentSheetIndex(index: Int) {
        _currentSheetIndex.value = index
    }

    fun selectTemplate(sheetIndex: Int, templateId: String) {
        selectedTemplates[sheetIndex] = templateId
    }

    fun setCompanyName(name: String) {
        _companyName.value = name
    }

    fun setContactText(text: String) {
        _contactText.value = text
    }

    fun uploadCustomerPhoto(file: File, sheetIndex: Int, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            _isUploading.value = true
            try {
                val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
                val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
                val resp = api.uploadFile(body)
                if (resp.success) {
                    _userPhotos.value = _userPhotos.value + (sheetIndex to resp.url)
                    onResult(true, "Photo uploaded successfully!")
                } else {
                    onResult(false, "Upload failed.")
                }
            } catch (e: Exception) {
                onResult(false, e.localizedMessage ?: "Upload error")
            } finally {
                _isUploading.value = false
            }
        }
    }

    fun updatePhotoTransform(sheetIndex: Int, scale: Float, offsetX: Float, offsetY: Float) {
        val current = _photoTransforms.value[sheetIndex] ?: ImageTransformState()
        _photoTransforms.value = _photoTransforms.value + (sheetIndex to current.copy(
            scale = scale.coerceIn(0.5f, 5.0f),
            offsetX = offsetX,
            offsetY = offsetY
        ))
    }

    fun resetPhotoTransform(sheetIndex: Int) {
        _photoTransforms.value = _photoTransforms.value + (sheetIndex to ImageTransformState())
    }

    fun updateGlobalFontFamily(font: String) {
        _globalTextStyle.value = _globalTextStyle.value.copy(fontFamily = font)
    }

    fun updateGlobalFontColor(colorHex: String) {
        _globalTextStyle.value = _globalTextStyle.value.copy(fontColor = colorHex)
    }

    fun toggleGlobalBold() {
        val current = _globalTextStyle.value
        _globalTextStyle.value = current.copy(isBold = !current.isBold)
    }

    fun toggleGlobalItalic() {
        val current = _globalTextStyle.value
        _globalTextStyle.value = current.copy(isItalic = !current.isItalic)
    }

    fun adjustGlobalFontSize(delta: Int) {
        val current = _globalTextStyle.value
        val newDelta = (current.fontSizeDelta + delta).coerceIn(-10, 20)
        _globalTextStyle.value = current.copy(fontSizeDelta = newDelta)
    }

    fun updateSlotTextStyle(slotId: String, style: CustomTextStyle) {
        _slotTextStyles.value = _slotTextStyles.value + (slotId to style)
    }

    fun uploadLogo(file: File, onResult: (Boolean, String) -> Unit) {
        viewModelScope.launch {
            _isUploading.value = true
            try {
                val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
                val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
                val resp = api.uploadFile(body)
                if (resp.success) {
                    _logoUrl.value = resp.url
                    onResult(true, "Brand Logo uploaded!")
                } else {
                    onResult(false, "Upload failed.")
                }
            } catch (e: Exception) {
                onResult(false, e.localizedMessage ?: "Upload error")
            } finally {
                _isUploading.value = false
            }
        }
    }

    fun submitOrder(
        product: Product,
        customerName: String,
        customerEmail: String,
        customerPhone: String,
        address: ShippingAddress,
        onResult: (Boolean, String) -> Unit
    ) {
        viewModelScope.launch {
            try {
                val sheetsList = product.sheets.mapIndexed { index, sheet ->
                    val chosenTemplate = selectedTemplates[index] ?: sheet.templates.firstOrNull()?.id ?: ""
                    SheetCustomization(
                        sheetNumber = sheet.sheetNumber,
                        templateId = chosenTemplate,
                        userImageUrl = _userPhotos.value[index],
                        logoUrl = _logoUrl.value,
                        customTexts = mapOf(
                            "company_name" to _companyName.value,
                            "contact_text" to _contactText.value
                        )
                    )
                }

                val orderReq = CreateOrderRequest(
                    customerName = customerName,
                    customerEmail = customerEmail,
                    customerPhone = customerPhone,
                    shippingAddress = address,
                    items = listOf(
                        OrderItemRequest(
                            productId = product.id,
                            quantity = 1,
                            year = 2027,
                            sheets = sheetsList
                        )
                    ),
                    payment = PaymentInfo(
                        method = "upi",
                        transactionId = "TXN_${System.currentTimeMillis()}"
                    )
                )

                val resp = api.createOrder(orderReq)
                onResult(true, "Order #${resp.orderNumber} placed successfully!")
            } catch (e: Exception) {
                onResult(false, e.localizedMessage ?: "Failed to place order")
            }
        }
    }
}
