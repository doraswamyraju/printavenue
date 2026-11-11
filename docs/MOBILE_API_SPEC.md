# PrintAvenue Native Mobile Integration Guide (Swift & Kotlin)

This document provides the complete API specification and native UI implementation guide for the **PrintAvenue iOS (Swift/SwiftUI)** and **Android (Kotlin/Jetpack Compose)** mobile apps.

---

## 1. Base URL & Authentication

- **Base URL**: `https://printavenue.sriddha.com/api`
- Content-Type: `application/json` (or `multipart/form-data` for file uploads)

---

## 2. API Endpoints

### 2.1 Fetch Products Catalog
- **Endpoint**: `GET /api/products`
- **Description**: Returns all products with their 13 sheets (Cover, Jan–Dec) and all design templates with arbitrary polygon coordinate mappings.

#### Response Example:
```json
[
  {
    "id": "desk-calendar-landscape",
    "slug": "customized-photo-desk-calendar-landscape",
    "title": "Customized Photo Desk Calendar (Rectangle Landscape)",
    "category": "desk",
    "orientation": "landscape",
    "dimensions": "A5 (8.3 x 5.8 inches)",
    "basePrice": 199,
    "tiers": [
      { "minQty": 1, "maxQty": 4, "pricePerUnit": 199 },
      { "minQty": 5, "maxQty": 9, "pricePerUnit": 169 },
      { "minQty": 10, "pricePerUnit": 149 }
    ],
    "sheets": [
      {
        "id": "sheet-7",
        "sheetNumber": 7,
        "title": "July",
        "aspectRatio": "1.414",
        "templates": [
          {
            "id": "tmpl_july_summer",
            "name": "July Summer Beach Cutout",
            "background": {
              "type": "image",
              "value": "https://printavenue.sriddha.com/uploads/july_art.png"
            },
            "imageLayout": {
              "x": 0,
              "y": 0,
              "width": 45,
              "height": 76,
              "shapeType": "polygon",
              "polygonPoints": "0% 0%, 34% 0%, 45% 38%, 35% 76%, 0% 76%",
              "layerPosition": "under-artwork"
            }
          }
        ]
      }
    ]
  }
]
```

---

### 2.2 Upload Customer Photo (Native Camera / Gallery)
- **Endpoint**: `POST /api/upload`
- **Format**: `multipart/form-data`
- **Field Name**: `file`

#### Response Example:
```json
{
  "success": true,
  "url": "/uploads/photo_1741700000_a1b2c3d.jpg",
  "filename": "photo_1741700000_a1b2c3d.jpg"
}
```

---

### 2.3 Place Order
- **Endpoint**: `POST /api/orders`
- **Method**: `POST`

#### Request Payload:
```json
{
  "customerName": "Raju Sharma",
  "customerEmail": "customer@example.com",
  "customerPhone": "+91 9876543210",
  "shippingAddress": {
    "line1": "Flat 402, Sunshine Towers",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001",
    "country": "India"
  },
  "items": [
    {
      "productId": "desk-calendar-landscape",
      "quantity": 2,
      "year": 2027,
      "sheets": [
        {
          "sheetNumber": 7,
          "templateId": "tmpl_july_summer",
          "userImageUrl": "https://printavenue.sriddha.com/uploads/photo_1741700000_a1b2c3d.jpg",
          "caption": "Summer Vacation with Family"
        }
      ]
    }
  ],
  "payment": {
    "method": "upi",
    "transactionId": "TXN_UPI_987654"
  }
}
```

---

## 3. Native Visual Customizer Implementation

### 3.1 Understanding the Coordinates
- `imageLayout.x`, `y`, `width`, `height`: Percentage values (0–100%) of the total sheet bounding box.
- `polygonPoints`: A comma-separated list of `X% Y%` vertex pairs relative to the photo bounding box.
- `layerPosition`:
  - `"under-artwork"`: The customer photo must be placed **behind** the base template image (e.g. flowers/leaves stay in front).
  - `"above-artwork"`: The customer photo is drawn **over** the base image.

---

### 3.2 iOS (SwiftUI) Models & Custom Polygon View

```swift
import SwiftUI

// MARK: - Models
struct DesignTemplate: Codable, Identifiable {
    let id: String
    let name: String
    let imageLayout: ImageLayout
    let background: BackgroundData
}

struct ImageLayout: Codable {
    let x: Double
    let y: Double
    let width: Double
    let height: Double
    let shapeType: String?
    let polygonPoints: String?
    let layerPosition: String?
}

struct BackgroundData: Codable {
    let type: String
    let value: String
}

// MARK: - Percentage Polygon Shape
struct PolygonClipShape: Shape {
    let points: [CGPoint] // Values normalized between 0.0 and 1.0

    func path(in rect: CGRect) -> Path {
        var path = Path()
        guard !points.isEmpty else { return path }
        path.move(to: CGPoint(x: points[0].x * rect.width, y: points[0].y * rect.height))
        for p in points.dropFirst() {
            path.addLine(to: CGPoint(x: p.x * rect.width, y: p.y * rect.height))
        }
        path.closeSubpath()
        return path
    }
}

// Helper to parse "0% 0%, 34% 0%, 45% 38%..." into [CGPoint]
func parsePolygonPoints(_ raw: String?) -> [CGPoint] {
    guard let raw = raw, !raw.isEmpty else {
        return [CGPoint(x: 0, y: 0), CGPoint(x: 1, y: 0), CGPoint(x: 1, y: 1), CGPoint(x: 0, y: 1)]
    }
    return raw.components(separatedBy: ",").compactMap { item -> CGPoint? {
        let parts = item.trimmingCharacters(in: .whitespaces).components(separatedBy: " ")
        guard parts.count == 2,
              let xVal = Double(parts[0].replacingOccurrences(of: "%", with: "")),
              let yVal = Double(parts[1].replacingOccurrences(of: "%", with: "")) else {
            return nil
        }
        return CGPoint(x: xVal / 100.0, y: yVal / 100.0)
    }
}
```

---

### 3.3 Android (Kotlin / Jetpack Compose)

```kotlin
package com.printavenue.customizer

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.GenericShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import coil.compose.AsyncImage

fun parsePolygonPoints(raw: String?): List<Offset> {
    if (raw.isNullOrBlank()) {
        return listOf(Offset(0f, 0f), Offset(1f, 0f), Offset(1f, 1f), Offset(0f, 1f))
    }
    return raw.split(",").mapNotNull { part ->
        val pieces = part.trim().split(" ")
        if (pieces.size == 2) {
            val x = pieces[0].replace("%", "").toFloatOrNull() ?: 0f
            val y = pieces[1].replace("%", "").toFloatOrNull() ?: 0f
            Offset(x / 100f, y / 100f)
        } else null
    }
}

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
```

---

## 4. Anti-Save & Anti-Screenshot on Mobile

### Android (Kotlin)
Add to your `MainActivity.kt`:
```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // Prevents user from taking screenshots, screen recording, or viewing in task switcher
    window.setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
    )
}
```

### iOS (Swift)
Wrap the customizer view inside a `UITextField` sublayer container with `isSecureTextEntry = true`. When the user captures a screenshot or screen record, iOS replaces the view content with solid black.

