package com.smartwarehouse.app.ui

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier

/**
 * Native Chat Activity using Jetpack Compose
 */
class NativeChatActivity : ComponentActivity() {
    private var conversationId: String? = null
    private var targetHouseholdId: String? = null
    private var targetHouseholdName: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Get parameters from intent
        conversationId = intent.getStringExtra("conversationId")
        targetHouseholdId = intent.getStringExtra("targetHouseholdId")
        targetHouseholdName = intent.getStringExtra("targetHouseholdName")

        if (conversationId == null || targetHouseholdId == null || targetHouseholdName == null) {
            Toast.makeText(this, "Missing required parameters", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        // Set Compose content
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    NativeChatScreen(
                        conversationId = conversationId!!,
                        targetHouseholdId = targetHouseholdId!!,
                        targetHouseholdName = targetHouseholdName!!,
                        onClose = { finish() }
                    )
                }
            }
        }
    }
}
