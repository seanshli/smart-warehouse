package com.smartwarehouse.app.plugins;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.util.Log;

// Midea MSmartSDK imports
import com.midea.iot.msmart.MSConfig;
import com.midea.iot.msmart.MSInterface;
import com.midea.iot.msmart.MSTokenRefresh;
import com.midea.iot.msmart.config.MSDeviceConfigManager;
import com.midea.iot.msmart.config.MSDeviceConfigStep;
import com.midea.iot.msmart.config.MSDeviceConfigType;
import com.midea.iot.msmart.config.MSProgressCallback;
import com.midea.iot.msmart.config.ap.MSDeviceApConfigParams;
import com.midea.iot.msmart.entity.MSDevice;
import com.midea.iot.msmart.entity.MSErrorMessage;

@CapacitorPlugin(name = "MideaProvisioning")
public class MideaProvisioningPlugin extends Plugin {

    private static final String TAG = "MideaProvisioningPlugin";
    private boolean isInitialized = false;
    private String currentToken = null;
    private PluginCall currentProvisioningCall = null;
    private Handler mainHandler = new Handler(Looper.getMainLooper());

    @PluginMethod
    public void initialize(PluginCall call) {
        String clientId = call.getString("clientId");
        String clientSecret = call.getString("clientSecret");
        String serverHost = call.getString("serverHost");
        String clientSrc = call.getString("clientSrc");
        String accessToken = call.getString("accessToken");

        if (TextUtils.isEmpty(clientId) || TextUtils.isEmpty(clientSecret) || 
            TextUtils.isEmpty(serverHost) || TextUtils.isEmpty(accessToken)) {
            call.reject("Midea credentials are required: clientId, clientSecret, serverHost, accessToken");
            return;
        }

        try {
            Context context = getContext();
            if (context == null) {
                call.reject("Failed to get Android context");
                return;
            }

            // Initialize MSmartSDK
            MSConfig config = new MSConfig();
            config.serverHost = serverHost;
            config.enableLog = true; // Enable SDK logging
            config.clientId = clientId;
            config.clientSecret = clientSecret;

            // Initialize SDK in OVERSEAS_OEM mode
            MSInterface.getInstance().initSDK(
                context.getApplicationContext(),
                MSInterface.WorkMode.OVERSEAS_OEM,
                config
            );

            // Set access token
            MSInterface.getInstance().setAccessToken(String.format("Bearer %s", accessToken));

            // Set token refresh delegate
            MSInterface.getInstance().setTokenRefreshDelegate(new MSTokenRefresh() {
                @Override
                public boolean refreshToken() {
                    // Token refresh should be handled by the app
                    // For now, just return true if we have a token
                    if (!TextUtils.isEmpty(accessToken)) {
                        MSInterface.getInstance().setAccessToken(String.format("Bearer %s", accessToken));
                        return true;
                    }
                    return false;
                }
            });

            isInitialized = true;

            JSObject data = new JSObject();
            data.put("initialized", true);
            data.put("native", true);
            data.put("message", "Midea MSmartSDK initialized successfully");
            call.resolve(data);
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize Midea SDK", e);
            call.reject("Failed to initialize Midea SDK: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startProvisioning(PluginCall call) {
        if (!isInitialized) {
            call.reject("Midea SDK not initialized. Call initialize() first.");
            return;
        }

        String mode = call.getString("mode");
        if (mode == null || !mode.equalsIgnoreCase("ap")) {
            call.reject("Midea currently only supports AP mode provisioning");
            return;
        }

        String deviceSsid = call.getString("deviceSsid");
        String routerSsid = call.getString("ssid");
        String routerPassword = call.getString("password");
        String routerSecurityParams = call.getString("routerSecurityParams");

        if (TextUtils.isEmpty(deviceSsid) || TextUtils.isEmpty(routerSsid) || 
            TextUtils.isEmpty(routerPassword)) {
            call.reject("Device SSID, Router SSID, and password are required for AP mode");
            return;
        }

        // Default security params if not provided
        if (TextUtils.isEmpty(routerSecurityParams)) {
            routerSecurityParams = "[WPA2-PSK-CCMP][RSN-PSK-CCMP][ESS]";
        }

        try {
            currentProvisioningCall = call;
            currentToken = "midea_ap_" + System.currentTimeMillis();

            Context context = getContext();
            if (context == null) {
                call.reject("Failed to get Android context");
                return;
            }

            // Create AP config params
            MSDeviceApConfigParams params = new MSDeviceApConfigParams(
                context.getApplicationContext(),
                deviceSsid,
                routerSsid,
                routerSecurityParams,
                routerPassword
            );

            // Start provisioning
            MSDeviceConfigType configType = MSDeviceConfigType.MSDeviceConfigAP;
            
            // Stop any existing provisioning first
            MSDeviceConfigManager.getInstance().stopConfigureDevice();

            // Start provisioning on main thread
            mainHandler.post(() -> {
                MSDeviceConfigManager.getInstance().startConfigureDevice(
                    params,
                    configType,
                    new MSProgressCallback<MSDevice, MSDeviceConfigStep>() {
                        @Override
                        public void onError(MSErrorMessage errorMessage) {
                            Log.e(TAG, "Midea provisioning error: " + errorMessage.getErrorMessage());
                            
                            if (currentProvisioningCall != null) {
                                JSObject result = new JSObject();
                                result.put("success", false);
                                result.put("error", errorMessage.getErrorMessage());
                                result.put("errorCode", errorMessage.getErrorCode());
                                result.put("subErrorCode", errorMessage.getSubErrorCode());
                                result.put("status", "failed");
                                result.put("token", currentToken);
                                currentProvisioningCall.reject(errorMessage.getErrorMessage(), result);
                                currentProvisioningCall = null;
                            }
                        }

                        @Override
                        public void onComplete(MSDevice device) {
                            // MSDevice may not have getDeviceId() method
                            // Try to get device info using available methods
                            String deviceId = null;
                            String deviceName = null;
                            String deviceType = null;
                            
                            try {
                                // Try different possible method names
                                if (device != null) {
                                    // Try reflection to find the correct method
                                    try {
                                        java.lang.reflect.Method getIdMethod = device.getClass().getMethod("getDeviceId");
                                        deviceId = (String) getIdMethod.invoke(device);
                                    } catch (Exception e1) {
                                        try {
                                            java.lang.reflect.Method getIdMethod = device.getClass().getMethod("getDeviceID");
                                            deviceId = (String) getIdMethod.invoke(device);
                                        } catch (Exception e2) {
                                            try {
                                                java.lang.reflect.Method getIdMethod = device.getClass().getMethod("getId");
                                                deviceId = (String) getIdMethod.invoke(device);
                                            } catch (Exception e3) {
                                                // Use toString as fallback
                                                deviceId = device.toString();
                                            }
                                        }
                                    }
                                    
                                    try {
                                        java.lang.reflect.Method getNameMethod = device.getClass().getMethod("getDeviceName");
                                        deviceName = (String) getNameMethod.invoke(device);
                                    } catch (Exception e) {
                                        deviceName = "Unknown";
                                    }
                                    
                                    try {
                                        java.lang.reflect.Method getTypeMethod = device.getClass().getMethod("getDeviceType");
                                        deviceType = (String) getTypeMethod.invoke(device);
                                    } catch (Exception e) {
                                        deviceType = "Unknown";
                                    }
                                }
                            } catch (Exception e) {
                                Log.e(TAG, "Error getting device info", e);
                            }
                            
                            Log.d(TAG, "Midea provisioning complete: " + deviceId);
                            
                            if (currentProvisioningCall != null) {
                                JSObject result = new JSObject();
                                result.put("success", true);
                                if (deviceId != null) {
                                    result.put("deviceId", deviceId);
                                }
                                if (deviceName != null) {
                                    result.put("deviceName", deviceName);
                                }
                                result.put("status", "success");
                                result.put("token", currentToken);
                                
                                // Add device info
                                if (deviceId != null || deviceName != null || deviceType != null) {
                                    JSObject deviceInfo = new JSObject();
                                    if (deviceId != null) {
                                        deviceInfo.put("deviceId", deviceId);
                                    }
                                    if (deviceName != null) {
                                        deviceInfo.put("deviceName", deviceName);
                                    }
                                    if (deviceType != null) {
                                        deviceInfo.put("deviceType", deviceType);
                                    }
                                    result.put("deviceInfo", deviceInfo);
                                }
                                
                                currentProvisioningCall.resolve(result);
                                currentProvisioningCall = null;
                            }
                        }

                        @Override
                        public void onProgress(MSDeviceConfigStep step, MSDevice device) {
                            Log.d(TAG, "Midea provisioning progress: " + step);
                            
                            // Optionally send progress updates
                            if (currentProvisioningCall != null) {
                                JSObject progress = new JSObject();
                                progress.put("step", step != null ? step.toString() : "unknown");
                                progress.put("status", "provisioning");
                                progress.put("token", currentToken);
                                
                                // Try to get device ID if device is available
                                if (device != null) {
                                    try {
                                        String deviceId = null;
                                        try {
                                            java.lang.reflect.Method getIdMethod = device.getClass().getMethod("getDeviceId");
                                            deviceId = (String) getIdMethod.invoke(device);
                                        } catch (Exception e1) {
                                            try {
                                                java.lang.reflect.Method getIdMethod = device.getClass().getMethod("getDeviceID");
                                                deviceId = (String) getIdMethod.invoke(device);
                                            } catch (Exception e2) {
                                                try {
                                                    java.lang.reflect.Method getIdMethod = device.getClass().getMethod("getId");
                                                    deviceId = (String) getIdMethod.invoke(device);
                                                } catch (Exception e3) {
                                                    // Ignore - device ID not available
                                                }
                                            }
                                        }
                                        if (deviceId != null) {
                                            progress.put("deviceId", deviceId);
                                        }
                                    } catch (Exception e) {
                                        // Ignore - device info not available
                                    }
                                }
                                
                                // Note: Capacitor doesn't support streaming responses
                                // Progress updates would need to be handled differently
                            }
                        }
                    }
                );
            });

            // Return immediately with provisioning started status
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("token", currentToken);
            result.put("status", "provisioning");
            result.put("message", "Midea AP mode provisioning started");
            result.put("mode", "ap");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Failed to start Midea provisioning", e);
            call.reject("Failed to start Midea provisioning: " + e.getMessage());
            currentProvisioningCall = null;
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        String token = call.getString("token");
        if (token == null) {
            token = currentToken;
        }

        if (token == null) {
            call.reject("Provisioning token is required");
            return;
        }

        JSObject result = new JSObject();
        result.put("success", true);
        result.put("status", currentProvisioningCall != null ? "provisioning" : "idle");
        result.put("token", token);
        call.resolve(result);
    }

    @PluginMethod
    public void stopProvisioning(PluginCall call) {
        try {
            MSDeviceConfigManager.getInstance().stopConfigureDevice();

            currentToken = null;

            if (currentProvisioningCall != null) {
                currentProvisioningCall.reject("Provisioning stopped by user");
                currentProvisioningCall = null;
            }

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Provisioning stopped");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Stop provisioning error", e);
            call.reject("Failed to stop provisioning: " + e.getMessage());
        }
    }

    @PluginMethod
    public void resumeProvisioning(PluginCall call) {
        try {
            MSDeviceConfigManager.getInstance().resumeConfigureDevice();

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Provisioning resumed");
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Resume provisioning error", e);
            call.reject("Failed to resume provisioning: " + e.getMessage());
        }
    }
}

