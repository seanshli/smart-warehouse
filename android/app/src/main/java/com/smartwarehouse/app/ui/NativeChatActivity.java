package com.smartwarehouse.app.ui;

import android.os.Bundle;
import android.widget.Toast;

import androidx.activity.ComponentActivity;
import androidx.activity.compose.setContent;
import androidx.compose.foundation.layout.fillMaxSize;
import androidx.compose.material3.MaterialTheme;
import androidx.compose.material3.Surface;
import androidx.compose.ui.Modifier;

/**
 * Native Chat Activity using Jetpack Compose
 */
public class NativeChatActivity extends ComponentActivity {
    private String conversationId;
    private String targetHouseholdId;
    private String targetHouseholdName;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Get parameters from intent
        conversationId = getIntent().getStringExtra("conversationId");
        targetHouseholdId = getIntent().getStringExtra("targetHouseholdId");
        targetHouseholdName = getIntent().getStringExtra("targetHouseholdName");

        if (conversationId == null || targetHouseholdId == null || targetHouseholdName == null) {
            Toast.makeText(this, "Missing required parameters", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // Set Compose content
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    NativeChatScreen(
                        conversationId = conversationId,
                        targetHouseholdId = targetHouseholdId,
                        targetHouseholdName = targetHouseholdName,
                        onClose = this::finish
                    );
                }
            }
        }
    }
}
