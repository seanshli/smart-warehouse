package com.smartwarehouse.app.plugins;

import android.app.Activity;
import android.content.Intent;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.smartwarehouse.app.ui.NativeChatActivity;

/**
 * Native Chat Plugin for Android
 * Provides native chat interface
 */
@CapacitorPlugin(name = "NativeChat")
public class NativeChatPlugin extends Plugin {
    private static final String TAG = "NativeChatPlugin";

    @PluginMethod
    public void showChat(PluginCall call) {
        String conversationId = call.getString("conversationId");
        String targetHouseholdId = call.getString("targetHouseholdId");
        String targetHouseholdName = call.getString("targetHouseholdName");

        if (conversationId == null || targetHouseholdId == null || targetHouseholdName == null) {
            call.reject("Missing required parameters: conversationId, targetHouseholdId, targetHouseholdName");
            return;
        }

        Activity activity = getActivity();
        if (activity == null) {
            call.reject("Cannot access activity");
            return;
        }

        // Launch native chat activity
        Intent intent = new Intent(activity, NativeChatActivity.class);
        intent.putExtra("conversationId", conversationId);
        intent.putExtra("targetHouseholdId", targetHouseholdId);
        intent.putExtra("targetHouseholdName", targetHouseholdName);
        
        activity.startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void sendMessage(PluginCall call) {
        String message = call.getString("message");
        String conversationId = call.getString("conversationId");

        if (message == null || conversationId == null) {
            call.reject("Missing required parameters: message, conversationId");
            return;
        }

        // Send message via API
        // This would typically use OkHttp or similar
        // For now, we'll resolve immediately
        // TODO: Implement actual API call
        
        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }
}
