package com.smartwarehouse.domain.model

import com.google.gson.annotations.SerializedName

/**
 * Domain models for Smart Warehouse
 */

data class User(
    val id: String,
    val name: String? = null,
    val email: String? = null,
    val image: String? = null,
    val language: String? = null
)

data class Household(
    val id: String,
    val name: String,
    val invitationCode: String? = null
)

data class Item(
    val id: String,
    val name: String,
    val description: String? = null,
    val quantity: Int,
    val minQuantity: Int = 0,
    val barcode: String? = null,
    val qrCode: String? = null,
    val imageUrl: String? = null,
    val tags: List<String>? = null,
    val buyDate: String? = null,
    val buyCost: Double? = null,
    val buyLocation: String? = null,
    val invoiceNumber: String? = null,
    val sellerName: String? = null,
    val category: Category? = null,
    val room: Room? = null,
    val cabinet: Cabinet? = null,
    val createdAt: String? = null,
    val updatedAt: String? = null
) {
    val isLowStock: Boolean
        get() = quantity <= minQuantity
    
    val displayLocation: String
        get() = listOfNotNull(room?.name, cabinet?.name).joinToString(" → ")
    
    val displayCategory: String
        get() = listOfNotNull(category?.parent?.name, category?.name).joinToString(" → ")
}

data class Room(
    val id: String,
    val name: String,
    val description: String? = null,
    val icon: String? = null,
    val cabinets: List<Cabinet>? = null,
    @SerializedName("_count")
    val count: RoomCount? = null
)

data class RoomCount(
    val items: Int? = null,
    val cabinets: Int? = null
)

data class Cabinet(
    val id: String,
    val name: String,
    val description: String? = null
)

data class Category(
    val id: String,
    val name: String,
    val icon: String? = null,
    val parentId: String? = null,
    val parent: Category? = null,
    val children: List<Category>? = null
)

data class DashboardStats(
    val totalItems: Int,
    val totalRooms: Int,
    val totalCategories: Int,
    val lowStockItems: Int,
    val recentItems: List<Item>? = null
)

data class RecognitionResult(
    val name: String? = null,
    val description: String? = null,
    val category: String? = null,
    val confidence: Double? = null,
    val barcode: String? = null,
    val language: String? = null
)

data class IoTDevice(
    val id: String,
    val deviceId: String,
    val name: String,
    val vendor: String,
    val type: String? = null,
    val status: String,
    val state: Map<String, Any>? = null,
    val metadata: Map<String, Any>? = null
) {
    val isOnline: Boolean
        get() = status == "online"
    
    val vendorDisplayName: String
        get() = when (vendor) {
            "tuya" -> "Tuya"
            "midea" -> "Midea"
            "shelly" -> "Shelly"
            "esp" -> "ESP"
            "aqara" -> "Aqara"
            "philips" -> "Philips Hue"
            "panasonic" -> "Panasonic"
            "knx" -> "KNX"
            else -> vendor
        }
}

/**
 * Supported languages
 */
enum class AppLanguage(
    val code: String,
    val displayName: String,
    val iflytekCode: String,
    val whisperCode: String
) {
    ENGLISH("en", "English", "en_us", "en"),
    TRADITIONAL_CHINESE("zh-TW", "繁體中文", "zh_tw", "zh"),
    SIMPLIFIED_CHINESE("zh", "简体中文", "zh_cn", "zh"),
    JAPANESE("ja", "日本語", "ja_jp", "ja");
    
    companion object {
        fun fromCode(code: String): AppLanguage {
            return values().find { it.code == code } ?: ENGLISH
        }
    }
}
