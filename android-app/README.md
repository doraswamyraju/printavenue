# PrintAvenue Native Android Application

A high-performance native Android application built with **Kotlin** and **Jetpack Compose** providing visual customization, arbitrary polygon cutouts, and seamless checkout for PrintAvenue calendars, mementos, and prints.

---

## 🚀 Key Features

1. **Native Arbitrary Vector / Polygon Renderer (`SheetCanvasRenderer.kt`)**:
   - Parses multi-point normalized coordinate strings (e.g. `0% 0%, 34% 0%, 45% 38%...`).
   - Uses Jetpack Compose `GenericShape` for precise image clipping.
   - Dual-layer positioning: `under-artwork` (leaves/flowers stay in front) or `above-artwork`.
   - Dynamic aspect-ratio preservation to prevent vertical stretching.
   - Circular and rounded branding logo badge slot.
   - Dynamic styled typography overlays.

2. **Catalog & Studio Integration**:
   - Live products and sheets synchronized via Retrofit directly from `https://printavenue.sriddha.com/api/products`.
   - Filters out draft/staging products.
   - Sheet switcher tabs (Jan–Dec / Cover / Front).

3. **Native Media Upload**:
   - Direct integration with Android Gallery picker via `ActivityResultContracts.GetContent()`.
   - Multipart file upload to `POST /api/upload`.

4. **Security & Screenshot Protection**:
   - Implements `FLAG_SECURE` in `MainActivity.kt` to prevent screenshots, screen recording, and task-switcher previews of protected artwork designs.

5. **Integrated Checkout Flow**:
   - Direct ordering via `POST /api/orders` with delivery address and UPI reference tracking.

---

## 🛠️ How to Open and Run in Android Studio

1. Launch **Android Studio**.
2. Select **Open** and browse to:
   ```
   d:\printavenue\android-app
   ```
3. Android Studio will automatically recognize Gradle, download dependencies, and perform project sync.
4. Select an Android emulator or connect a physical Android device (Android 8.0+ / API 26+).
5. Click **Run 'app'** (`Shift + F10`).
