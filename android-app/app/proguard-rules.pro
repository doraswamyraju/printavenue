# Add project specific ProGuard rules here.
-keep class com.printavenue.app.data.model.** { *; }
-keepclassmembers class * {
    @com.google.gson.annotations.SerializedName <fields>;
}
