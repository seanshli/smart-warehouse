package com.smartwarehouse.app.ui;

import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

/**
 * Native Chat Activity
 * Note: This is a placeholder. For full native chat UI, implement with standard Android Views or convert to Kotlin for Compose.
 */
public class NativeChatActivity extends AppCompatActivity {
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

        // For now, show a simple message
        // TODO: Implement full native chat UI
        Toast.makeText(this, "Chat: " + targetHouseholdName, Toast.LENGTH_SHORT).show();
        finish();
    }
}
