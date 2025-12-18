package com.smartwarehouse.data.remote

import com.smartwarehouse.domain.model.*
import retrofit2.Response
import retrofit2.http.*

/**
 * Retrofit API service interface for Smart Warehouse backend
 */
interface ApiService {
    
    // ========== Authentication ==========
    
    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): Response<AuthResponse>
    
    @POST("auth/signin")
    suspend fun signIn(@Body request: SignInRequest): Response<AuthResponse>
    
    @POST("auth/signout")
    suspend fun signOut(): Response<Unit>
    
    // ========== Items ==========
    
    @GET("warehouse/items")
    suspend fun getItems(
        @Query("language") language: String,
        @Query("householdId") householdId: String? = null,
        @Query("roomId") roomId: String? = null,
        @Query("categoryId") categoryId: String? = null,
        @Query("page") page: Int? = null,
        @Query("limit") limit: Int? = null
    ): Response<ItemListResponse>
    
    @GET("warehouse/items/{id}")
    suspend fun getItem(
        @Path("id") id: String,
        @Query("language") language: String
    ): Response<Item>
    
    @POST("warehouse/items")
    suspend fun createItem(@Body request: CreateItemRequest): Response<Item>
    
    @PUT("warehouse/items/{id}")
    suspend fun updateItem(
        @Path("id") id: String,
        @Body request: UpdateItemRequest
    ): Response<Item>
    
    @DELETE("warehouse/items/{id}")
    suspend fun deleteItem(@Path("id") id: String): Response<Unit>
    
    @POST("warehouse/items/{id}/checkout")
    suspend fun checkoutItem(
        @Path("id") id: String,
        @Body request: CheckoutItemRequest
    ): Response<Item>
    
    // ========== Rooms ==========
    
    @GET("warehouse/rooms")
    suspend fun getRooms(
        @Query("language") language: String,
        @Query("householdId") householdId: String? = null
    ): Response<List<Room>>
    
    @GET("warehouse/rooms/{id}")
    suspend fun getRoom(
        @Path("id") id: String,
        @Query("language") language: String
    ): Response<Room>
    
    @POST("warehouse/rooms")
    suspend fun createRoom(@Body request: CreateRoomRequest): Response<Room>
    
    @PUT("warehouse/rooms/{id}")
    suspend fun updateRoom(
        @Path("id") id: String,
        @Body request: UpdateRoomRequest
    ): Response<Room>
    
    @DELETE("warehouse/rooms/{id}")
    suspend fun deleteRoom(@Path("id") id: String): Response<Unit>
    
    @GET("warehouse/rooms/{id}/items")
    suspend fun getRoomItems(
        @Path("id") id: String,
        @Query("language") language: String
    ): Response<ItemListResponse>
    
    // ========== Categories ==========
    
    @GET("warehouse/categories")
    suspend fun getCategories(
        @Query("language") language: String,
        @Query("householdId") householdId: String? = null
    ): Response<List<Category>>
    
    @POST("warehouse/categories")
    suspend fun createCategory(@Body request: CreateCategoryRequest): Response<Category>
    
    // ========== Dashboard ==========
    
    @GET("warehouse/dashboard/stats")
    suspend fun getDashboardStats(
        @Query("householdId") householdId: String? = null
    ): Response<DashboardStats>
    
    // ========== Search ==========
    
    @GET("warehouse/search")
    suspend fun search(
        @Query("q") query: String,
        @Query("language") language: String
    ): Response<SearchResponse>
    
    // ========== AI Recognition ==========
    
    @POST("ai/recognize")
    suspend fun recognizeItem(@Body request: RecognitionRequest): Response<RecognitionResult>
    
    // ========== IoT ==========
    
    @GET("mqtt/devices")
    suspend fun getIoTDevices(
        @Query("householdId") householdId: String? = null
    ): Response<List<IoTDevice>>
    
    @POST("mqtt/iot/devices/{id}/control")
    suspend fun controlDevice(
        @Path("id") id: String,
        @Body request: DeviceControlRequest
    ): Response<DeviceControlResponse>
    
    // ========== User ==========
    
    @GET("user/language")
    suspend fun getUserLanguage(): Response<LanguageResponse>
    
    @PATCH("user/language")
    suspend fun updateUserLanguage(@Body request: UpdateLanguageRequest): Response<LanguageResponse>
    
    @GET("user/profile")
    suspend fun getUserProfile(): Response<UserProfileResponse>
}

// ========== Request/Response Models ==========

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String,
    val invitationCode: String? = null
)

data class SignInRequest(
    val email: String,
    val password: String
)

data class AuthResponse(
    val user: User?,
    val household: Household?,
    val token: String?
)

data class CreateItemRequest(
    val name: String,
    val description: String? = null,
    val quantity: Int = 1,
    val minQuantity: Int = 0,
    val category: String? = null,
    val subcategory: String? = null,
    val room: String,
    val cabinet: String? = null,
    val barcode: String? = null,
    val qrCode: String? = null,
    val imageUrl: String? = null,
    val tags: List<String>? = null,
    val householdId: String? = null,
    val buyDate: String? = null,
    val buyCost: Double? = null,
    val buyLocation: String? = null
)

data class UpdateItemRequest(
    val name: String? = null,
    val description: String? = null,
    val quantity: Int? = null,
    val minQuantity: Int? = null,
    val category: String? = null,
    val room: String? = null,
    val cabinet: String? = null,
    val barcode: String? = null,
    val imageUrl: String? = null,
    val tags: List<String>? = null
)

data class CheckoutItemRequest(
    val quantity: Int,
    val reason: String? = null
)

data class CreateRoomRequest(
    val name: String,
    val description: String? = null,
    val icon: String? = null,
    val householdId: String? = null
)

data class UpdateRoomRequest(
    val name: String? = null,
    val description: String? = null,
    val icon: String? = null
)

data class CreateCategoryRequest(
    val name: String,
    val icon: String? = null,
    val parentId: String? = null,
    val householdId: String? = null
)

data class RecognitionRequest(
    val type: String,
    val imageBase64: String? = null,
    val barcode: String? = null
)

data class DeviceControlRequest(
    val command: String,
    val value: Any? = null
)

data class DeviceControlResponse(
    val success: Boolean,
    val message: String? = null
)

data class UpdateLanguageRequest(
    val language: String
)

data class LanguageResponse(
    val language: String
)

data class UserProfileResponse(
    val user: User,
    val household: Household?
)

data class ItemListResponse(
    val items: List<Item>,
    val total: Int? = null,
    val page: Int? = null,
    val limit: Int? = null
)

data class SearchResponse(
    val results: List<Item>,
    val aiInterpretation: String? = null
)
