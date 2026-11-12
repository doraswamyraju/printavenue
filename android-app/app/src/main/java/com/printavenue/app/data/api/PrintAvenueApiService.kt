package com.printavenue.app.data.api

import com.printavenue.app.data.model.*
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.*
import java.util.concurrent.TimeUnit

interface PrintAvenueApiService {

    @GET("api/products")
    suspend fun getProducts(): List<Product>

    @Multipart
    @POST("api/upload")
    suspend fun uploadFile(
        @Part file: MultipartBody.Part
    ): UploadResponse

    @POST("api/orders")
    suspend fun createOrder(
        @Body order: CreateOrderRequest
    ): OrderResponse

    companion object {
        private const val BASE_URL = "https://printavenue.sriddha.com/"

        fun create(): PrintAvenueApiService {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            val client = OkHttpClient.Builder()
                .addInterceptor(logging)
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build()

            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(PrintAvenueApiService::class.java)
        }
    }
}
