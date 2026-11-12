package com.printavenue.app.data.model

import com.google.gson.annotations.SerializedName

data class Product(
    val id: String,
    val slug: String,
    val title: String,
    val category: String, // "desk", "wall", "memento", "banner", "card"
    val orientation: String,
    val dimensions: String,
    val basePrice: Double,
    val status: String? = "published",
    val tiers: List<PricingTier> = emptyList(),
    val sheets: List<ProductSheet> = emptyList()
)

data class PricingTier(
    val minQty: Int,
    val maxQty: Int?,
    val pricePerUnit: Double
)

data class ProductSheet(
    val id: String,
    val sheetNumber: Int,
    val title: String,
    val aspectRatio: String? = null,
    val templates: List<DesignTemplate> = emptyList()
)

data class DesignTemplate(
    val id: String,
    val name: String,
    val background: BackgroundData,
    val imageLayout: ImageLayout,
    val brandingBadge: BrandingBadge? = null,
    val textSlots: List<TextSlot>? = null
)

data class BackgroundData(
    val type: String, // "image" or "color"
    val value: String,
    val aspectRatio: Double? = null
)

data class ImageLayout(
    val x: Double = 0.0,
    val y: Double = 0.0,
    val width: Double = 100.0,
    val height: Double = 100.0,
    val shapeType: String? = "rectangle", // "rectangle" or "polygon"
    val polygonPoints: String? = null,
    val layerPosition: String? = "under-artwork" // "under-artwork" or "above-artwork"
)

data class BrandingBadge(
    val enabled: Boolean = false,
    val x: Double = 50.0,
    val y: Double = 15.0,
    val size: Double = 10.0,
    val shape: String = "circle" // "circle" or "rectangle"
)

data class TextSlot(
    val id: String,
    val label: String,
    val placeholder: String,
    val x: Double,
    val y: Double,
    val fontSize: Int = 14,
    val fontColor: String = "#ffffff",
    val fontWeight: String = "normal"
)

data class UploadResponse(
    val success: Boolean,
    val url: String,
    val filename: String
)

data class CreateOrderRequest(
    val customerName: String,
    val customerEmail: String,
    val customerPhone: String,
    val shippingAddress: ShippingAddress,
    val items: List<OrderItemRequest>,
    val payment: PaymentInfo
)

data class ShippingAddress(
    val line1: String,
    val city: String,
    val state: String,
    val pincode: String,
    val country: String = "India"
)

data class OrderItemRequest(
    val productId: String,
    val quantity: Int,
    val year: Int = 2027,
    val sheets: List<SheetCustomization>
)

data class SheetCustomization(
    val sheetNumber: Int,
    val templateId: String,
    val userImageUrl: String?,
    val logoUrl: String? = null,
    val customTexts: Map<String, String>? = null,
    val caption: String? = null
)

data class PaymentInfo(
    val method: String = "upi",
    val transactionId: String
)

data class OrderResponse(
    val id: String,
    val orderNumber: String,
    val status: String,
    val totalAmount: Double,
    val createdAt: String
)
