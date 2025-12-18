package com.smartwarehouse.data.local

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.smartwarehouse.domain.model.AppLanguage
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Secure preferences manager using EncryptedSharedPreferences
 */
@Singleton
class PreferencesManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()
    
    private val securePrefs = EncryptedSharedPreferences.create(
        context,
        "smart_warehouse_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )
    
    private val regularPrefs = context.getSharedPreferences(
        "smart_warehouse_prefs",
        Context.MODE_PRIVATE
    )
    
    // ========== Auth Token ==========
    
    fun saveAuthToken(token: String) {
        securePrefs.edit().putString(KEY_AUTH_TOKEN, token).apply()
    }
    
    fun getAuthToken(): String? {
        return securePrefs.getString(KEY_AUTH_TOKEN, null)
    }
    
    fun clearAuthToken() {
        securePrefs.edit().remove(KEY_AUTH_TOKEN).apply()
    }
    
    // ========== User Info ==========
    
    fun saveUserId(userId: String) {
        regularPrefs.edit().putString(KEY_USER_ID, userId).apply()
    }
    
    fun getUserId(): String? {
        return regularPrefs.getString(KEY_USER_ID, null)
    }
    
    fun saveHouseholdId(householdId: String) {
        regularPrefs.edit().putString(KEY_HOUSEHOLD_ID, householdId).apply()
    }
    
    fun getHouseholdId(): String? {
        return regularPrefs.getString(KEY_HOUSEHOLD_ID, null)
    }
    
    // ========== Language ==========
    
    fun saveLanguage(language: AppLanguage) {
        regularPrefs.edit().putString(KEY_LANGUAGE, language.code).apply()
    }
    
    fun getLanguage(): AppLanguage {
        val code = regularPrefs.getString(KEY_LANGUAGE, null)
        return if (code != null) {
            AppLanguage.fromCode(code)
        } else {
            // Detect from system
            detectSystemLanguage()
        }
    }
    
    private fun detectSystemLanguage(): AppLanguage {
        val locale = context.resources.configuration.locales.get(0)
        return when {
            locale.language == "zh" && (locale.country == "TW" || locale.country == "HK") -> 
                AppLanguage.TRADITIONAL_CHINESE
            locale.language == "zh" -> AppLanguage.SIMPLIFIED_CHINESE
            locale.language == "ja" -> AppLanguage.JAPANESE
            else -> AppLanguage.ENGLISH
        }
    }
    
    // ========== Clear All ==========
    
    fun clearAll() {
        securePrefs.edit().clear().apply()
        regularPrefs.edit().clear().apply()
    }
    
    companion object {
        private const val KEY_AUTH_TOKEN = "auth_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_HOUSEHOLD_ID = "household_id"
        private const val KEY_LANGUAGE = "language"
    }
}
