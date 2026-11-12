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
    val userPhotos = mutableStateMapOf<Int, String>()

    private val _companyName = MutableStateFlow("")
    val companyName: StateFlow<String> = _companyName

    private val _contactText = MutableStateFlow("")
    val contactText: StateFlow<String> = _contactText

    private val _logoUrl = MutableStateFlow<String?>(null)
    val logoUrl: StateFlow<String?> = _logoUrl

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
                    userPhotos[sheetIndex] = resp.url
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
                        userImageUrl = userPhotos[index],
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
