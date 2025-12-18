package com.smartwarehouse.data.repository

import com.smartwarehouse.data.local.PreferencesManager
import com.smartwarehouse.data.remote.*
import com.smartwarehouse.domain.model.Item
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for Item operations
 */
@Singleton
class ItemRepository @Inject constructor(
    private val apiService: ApiService,
    private val preferencesManager: PreferencesManager
) {
    private val currentLanguage: String
        get() = preferencesManager.getLanguage().code
    
    private val householdId: String?
        get() = preferencesManager.getHouseholdId()
    
    fun getItems(
        roomId: String? = null,
        categoryId: String? = null
    ): Flow<Result<List<Item>>> = flow {
        try {
            val response = apiService.getItems(
                language = currentLanguage,
                householdId = householdId,
                roomId = roomId,
                categoryId = categoryId
            )
            
            if (response.isSuccessful) {
                emit(Result.success(response.body()?.items ?: emptyList()))
            } else {
                emit(Result.failure(Exception("Failed to load items: ${response.code()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
    
    suspend fun getItem(id: String): Result<Item> {
        return try {
            val response = apiService.getItem(id, currentLanguage)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to load item: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun createItem(request: CreateItemRequest): Result<Item> {
        return try {
            val requestWithHousehold = request.copy(householdId = householdId)
            val response = apiService.createItem(requestWithHousehold)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to create item: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun updateItem(id: String, request: UpdateItemRequest): Result<Item> {
        return try {
            val response = apiService.updateItem(id, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to update item: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deleteItem(id: String): Result<Unit> {
        return try {
            val response = apiService.deleteItem(id)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception("Failed to delete item: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun checkoutItem(id: String, quantity: Int, reason: String? = null): Result<Item> {
        return try {
            val request = CheckoutItemRequest(quantity, reason)
            val response = apiService.checkoutItem(id, request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to checkout item: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun search(query: String): Result<List<Item>> {
        return try {
            val response = apiService.search(query, currentLanguage)
            if (response.isSuccessful) {
                Result.success(response.body()?.results ?: emptyList())
            } else {
                Result.failure(Exception("Search failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
