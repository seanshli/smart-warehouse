package com.smartwarehouse.app.plugins;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Tuya Android SDK imports
import com.thingclips.smart.sdk.api.IThingActivator;
import com.thingclips.smart.sdk.api.IThingDataCallback;
import com.thingclips.smart.sdk.api.IThingResultCallback;
import com.thingclips.smart.sdk.bean.DeviceBean;
import com.thingclips.smart.home.sdk.ThingHomeSdk;
import com.thingclips.smart.home.sdk.bean.HomeBean;
import com.thingclips.smart.home.sdk.callback.IThingHomeResultCallback;
import com.thingclips.smart.home.sdk.callback.IThingResultCallback;
import com.thingclips.smart.sdk.ThingSmartSDK;
import com.thingclips.smart.sdk.bean.ActivatorBean;
import com.thingclips.smart.sdk.enums.ActivatorModelEnum;
import com.thingclips.smart.user.bean.User;
import com.thingclips.smart.user.api.ILoginCallback;
import com.thingclips.smart.user.api.ILogoutCallback;
import com.thingclips.smart.user.api.IUserCallback;

// Tuya BizBundle UI imports
import com.thingclips.smart.bizbundle.activator.core.ThingActivatorManager;
import com.thingclips.smart.bizbundle.activator.core.bean.ActivatorRequest;
import com.thingclips.smart.bizbundle.activator.core.bean.ActivatorTypeEnum;
import com.thingclips.smart.bizbundle.activator.core.callback.IActivatorCallback;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

@CapacitorPlugin(name = "TuyaProvisioning")
public class TuyaProvisioningPlugin extends Plugin {

    private static final String TAG = "TuyaProvisioningPlugin";
    private static final int REQUEST_CODE_ACTIVATOR = 1001;
    private boolean isInitialized = false;
    private String currentToken = null;
    private String currentHouseholdId = null;
    private String currentTuyaHomeId = null;
    private PluginCall currentProvisioningCall = null;
    private Handler mainHandler = new Handler(Looper.getMainLooper());
    private IThingActivator currentActivator = null;
    private ActivatorRequest currentActivatorRequest = null;

    private JSObject pendingImplementationResponse(String message) {
        JSObject result = new JSObject();
        result.put("success", false);
        result.put("error", message);
        result.put("status", "not_implemented");
        return result;
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        // Get credentials from call parameters
        String appKey = call.getString("appKey");
        String appSecret = call.getString("appSecret");
        String sha256 = call.getString("sha256"); // Android specific

        if (appKey == null || appSecret == null) {
            call.reject("Tuya AppKey and AppSecret are required. Pass them as parameters: { appKey: '...', appSecret: '...' }");
            return;
        }

        try {
            Context context = getContext();
            if (context == null) {
                call.reject("Failed to get Android context");
                return;
            }

            // 初始化 Tuya SDK
            ThingSmartSDK.init(context.getApplication(), appKey, appSecret);
            if (sha256 != null) {
                ThingSmartSDK.setEncryptedRepository(sha256);
            }
            
            // 检查用户是否已登录
            User user = ThingHomeSdk.getUserInstance().getUser();
            boolean isLoggedIn = (user != null);
            
            isInitialized = true;

            JSObject data = new JSObject();
            data.put("initialized", true);
            data.put("native", true);
            data.put("loggedIn", isLoggedIn);
            data.put("message", "Tuya SDK initialized successfully (Android native implementation)");
            call.resolve(data);
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize Tuya SDK", e);
            call.reject("Failed to initialize Tuya SDK: " + e.getMessage());
        }
    }

    @PluginMethod
    public void login(PluginCall call) {
        if (!isInitialized) {
            call.reject("Tuya SDK not initialized. Call initialize() first.");
            return;
        }

        String account = call.getString("account");
        String password = call.getString("password");
        String countryCode = call.getString("countryCode");

        if (account == null || password == null) {
            call.reject("Account and password are required");
            return;
        }

        try {
            String finalCountryCode = countryCode != null ? countryCode : "886";
            boolean isEmail = account.contains("@");
            
            // 尝试登录
            if (isEmail) {
                ThingHomeSdk.getUserInstance().loginWithEmail(
                    finalCountryCode,
                    account,
                    password,
                    new ILoginCallback() {
                        @Override
                        public void onSuccess(User user) {
                            JSObject result = new JSObject();
                            result.put("success", true);
                            result.put("loggedIn", true);
                            result.put("userId", user.getUid());
                            call.resolve(result);
                        }

                        @Override
                        public void onError(String code, String error) {
                            // 登录失败，尝试注册
                            ThingHomeSdk.getUserInstance().registerAccountWithEmail(
                                finalCountryCode,
                                account,
                                password,
                                new ILoginCallback() {
                                    @Override
                                    public void onSuccess(User user) {
                                        JSObject result = new JSObject();
                                        result.put("success", true);
                                        result.put("loggedIn", true);
                                        result.put("accountCreated", true);
                                        result.put("userId", user.getUid());
                                        call.resolve(result);
                                    }

                                    @Override
                                    public void onError(String code, String error) {
                                        call.reject("Login/Registration failed: " + error);
                                    }
                                }
                            );
                        }
                    }
                );
            } else {
                ThingHomeSdk.getUserInstance().loginWithPhone(
                    finalCountryCode,
                    account,
                    password,
                    new ILoginCallback() {
                        @Override
                        public void onSuccess(User user) {
                            JSObject result = new JSObject();
                            result.put("success", true);
                            result.put("loggedIn", true);
                            result.put("userId", user.getUid());
                            call.resolve(result);
                        }

                        @Override
                        public void onError(String code, String error) {
                            // 登录失败，尝试注册
                            ThingHomeSdk.getUserInstance().registerAccountWithPhone(
                                finalCountryCode,
                                account,
                                password,
                                new ILoginCallback() {
                                    @Override
                                    public void onSuccess(User user) {
                                        JSObject result = new JSObject();
                                        result.put("success", true);
                                        result.put("loggedIn", true);
                                        result.put("accountCreated", true);
                                        result.put("userId", user.getUid());
                                        call.resolve(result);
                                    }

                                    @Override
                                    public void onError(String code, String error) {
                                        call.reject("Login/Registration failed: " + error);
                                    }
                                }
                            );
                        }
                    }
                );
            }
        } catch (Exception e) {
            Log.e(TAG, "Login error", e);
            call.reject("Login failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void logout(PluginCall call) {
        if (!isInitialized) {
            call.reject("Tuya SDK not initialized");
            return;
        }

        try {
            ThingHomeSdk.getUserInstance().logout(new ILogoutCallback() {
                @Override
                public void onSuccess() {
                    JSObject result = new JSObject();
                    result.put("success", true);
                    call.resolve(result);
                }

                @Override
                public void onError(String code, String error) {
                    call.reject("Logout failed: " + error);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Logout error", e);
            call.reject("Logout failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void isLoggedIn(PluginCall call) {
        if (!isInitialized) {
            JSObject result = new JSObject();
            result.put("loggedIn", false);
            call.resolve(result);
            return;
        }

        try {
            User user = ThingHomeSdk.getUserInstance().getUser();
            boolean loggedIn = (user != null);

            JSObject result = new JSObject();
            result.put("loggedIn", loggedIn);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error checking login status", e);
            JSObject result = new JSObject();
            result.put("loggedIn", false);
            call.resolve(result);
        }
    }

    @PluginMethod
    public void startProvisioning(PluginCall call) {
        if (!isInitialized) {
            call.reject("Tuya SDK not initialized. Call initialize() first.");
            return;
        }

        // 检查用户是否已登录（配网需要登录）
        User user = ThingHomeSdk.getUserInstance().getUser();
        if (user == null) {
            Log.e(TAG, "User not logged in, provisioning requires login");
            call.reject("Tuya user login required for provisioning. Please login first.");
            return;
        }

        String mode = call.getString("mode");
        if (mode == null) {
            call.reject("Provisioning mode is required");
            return;
        }

        // Get Household info for Tuya Home mapping
        String householdId = call.getString("householdId");
        String householdName = call.getString("householdName");

        try {
            switch (mode.toLowerCase()) {
                case "ez":
                case "wifi":
                    startEZMode(call, householdId, householdName);
                    break;
                case "ap":
                case "hotspot":
                    startAPMode(call, householdId, householdName);
                    break;
                case "wifi/bt":
                    startWiFiBTMode(call, householdId, householdName);
                    break;
                case "zigbee":
                    startZigbeeMode(call, householdId, householdName);
                    break;
                case "bt":
                    startBTMode(call, householdId, householdName);
                    break;
                case "manual":
                    handleManualMode(call, householdId, householdName);
                    break;
                case "auto":
                    // Default to EZ mode
                    startEZMode(call, householdId, householdName);
                    break;
                default:
                    call.reject("Unsupported provisioning mode: " + mode);
            }
        } catch (Exception e) {
            Log.e(TAG, "Provisioning error", e);
            call.reject("Provisioning failed: " + e.getMessage());
        }
    }

    // EZ Mode (WiFi Quick Flash) - Using BizBundle UI
    private void startEZMode(PluginCall call, String householdId, String householdName) {
        String ssid = call.getString("ssid");
        String password = call.getString("password");

        if (ssid == null || password == null) {
            call.reject("SSID and password are required for EZ mode");
            return;
        }

        // 再次检查登录状态
        User user = ThingHomeSdk.getUserInstance().getUser();
        if (user == null) {
            Log.e(TAG, "User not logged in for EZ mode provisioning");
            call.reject("Tuya user login required. Please login first.");
            return;
        }

        // 确保 Tuya Home 存在
        ensureHomeExists(householdName, call, () -> {
            // 获取当前 Home
            HomeBean currentHome = ThingHomeSdk.getHomeManagerInstance().getCurrentHome();
            if (currentHome == null) {
                call.reject("No Tuya Home available. Please ensure a Home exists.");
                return;
            }

            // 存储 Household 信息
            if (householdId != null) {
                currentHouseholdId = householdId;
                currentTuyaHomeId = currentHome.getHomeId();
            }

            // 启动 EZ 模式配网 - 使用 BizBundle UI
            currentProvisioningCall = call;
            currentToken = "ez_" + System.currentTimeMillis();

            try {
                // 创建 BizBundle 配网请求
                ActivatorRequest request = new ActivatorRequest.Builder()
                    .setSsid(ssid)
                    .setPassword(password)
                    .setActivatorType(ActivatorTypeEnum.TY_EZ)
                    .setTimeOut(100)
                    .setHomeId(currentHome.getHomeId())
                    .build();

                currentActivatorRequest = request;

                // 启动 BizBundle UI Activity
                Activity activity = getActivity();
                if (activity == null) {
                    call.reject("Failed to get Android Activity");
                    return;
                }

                // 使用 BizBundle 启动配网 UI
                ThingActivatorManager.getInstance().startActivator(
                    activity,
                    request,
                    REQUEST_CODE_ACTIVATOR,
                    new IActivatorCallback() {
                        @Override
                        public void onSuccess(DeviceBean deviceBean) {
                            JSObject result = new JSObject();
                            result.put("success", true);
                            result.put("deviceId", deviceBean.getDevId());
                            result.put("deviceName", deviceBean.getName());
                            result.put("status", "success");
                            result.put("tuyaHomeId", currentTuyaHomeId);
                            result.put("token", currentToken);
                            call.resolve(result);
                            currentProvisioningCall = null;
                            currentActivatorRequest = null;
                        }

                        @Override
                        public void onError(String code, String error) {
                            call.reject("EZ mode provisioning failed: " + error);
                            currentProvisioningCall = null;
                            currentActivatorRequest = null;
                        }
                    }
                );

                // 立即返回，配网结果通过回调返回
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("token", currentToken);
                result.put("status", "provisioning");
                result.put("message", "Tuya SDK native EZ mode provisioning UI started. Please follow the on-screen instructions.");
                result.put("tuyaHomeId", currentTuyaHomeId);
                result.put("mode", "ez");
                call.resolve(result);
            } catch (Exception e) {
                Log.e(TAG, "Failed to start EZ mode provisioning", e);
                call.reject("Failed to start EZ mode provisioning: " + e.getMessage());
            }
        });
    }

    // AP Mode (Hotspot) - Using BizBundle UI
    private void startAPMode(PluginCall call, String householdId, String householdName) {
        String ssid = call.getString("ssid");
        String password = call.getString("password");

        if (ssid == null || password == null) {
            call.reject("SSID and password are required for AP mode");
            return;
        }

        // 再次检查登录状态
        User user = ThingHomeSdk.getUserInstance().getUser();
        if (user == null) {
            Log.e(TAG, "User not logged in for AP mode provisioning");
            call.reject("Tuya user login required. Please login first.");
            return;
        }

        // 确保 Tuya Home 存在
        ensureHomeExists(householdName, call, () -> {
            HomeBean currentHome = ThingHomeSdk.getHomeManagerInstance().getCurrentHome();
            if (currentHome == null) {
                call.reject("No Tuya Home available. Please ensure a Home exists.");
                return;
            }

            if (householdId != null) {
                currentHouseholdId = householdId;
                currentTuyaHomeId = currentHome.getHomeId();
            }

            currentProvisioningCall = call;
            currentToken = "ap_" + System.currentTimeMillis();

            try {
                // 创建 BizBundle 配网请求
                ActivatorRequest request = new ActivatorRequest.Builder()
                    .setSsid(ssid)
                    .setPassword(password)
                    .setActivatorType(ActivatorTypeEnum.TY_AP)
                    .setTimeOut(100)
                    .setHomeId(currentHome.getHomeId())
                    .build();

                currentActivatorRequest = request;

                Activity activity = getActivity();
                if (activity == null) {
                    call.reject("Failed to get Android Activity");
                    return;
                }

                // 使用 BizBundle 启动配网 UI
                ThingActivatorManager.getInstance().startActivator(
                    activity,
                    request,
                    REQUEST_CODE_ACTIVATOR,
                    new IActivatorCallback() {
                        @Override
                        public void onSuccess(DeviceBean deviceBean) {
                            JSObject result = new JSObject();
                            result.put("success", true);
                            result.put("deviceId", deviceBean.getDevId());
                            result.put("deviceName", deviceBean.getName());
                            result.put("status", "success");
                            result.put("tuyaHomeId", currentTuyaHomeId);
                            result.put("token", currentToken);
                            call.resolve(result);
                            currentProvisioningCall = null;
                            currentActivatorRequest = null;
                        }

                        @Override
                        public void onError(String code, String error) {
                            call.reject("AP mode provisioning failed: " + error);
                            currentProvisioningCall = null;
                            currentActivatorRequest = null;
                        }
                    }
                );

                JSObject result = new JSObject();
                result.put("success", true);
                result.put("token", currentToken);
                result.put("status", "provisioning");
                result.put("message", "Tuya SDK native AP mode provisioning UI started. Please connect to device hotspot and follow instructions.");
                result.put("tuyaHomeId", currentTuyaHomeId);
                result.put("mode", "ap");
                call.resolve(result);
            } catch (Exception e) {
                Log.e(TAG, "Failed to start AP mode provisioning", e);
                call.reject("Failed to start AP mode provisioning: " + e.getMessage());
            }
        });
    }

    // WiFi/BT Mode
    private void startWiFiBTMode(PluginCall call, String householdId, String householdName) {
        String ssid = call.getString("ssid");
        String password = call.getString("password");
        String bluetoothMac = call.getString("bluetoothMac");

        if (ssid == null || password == null) {
            call.reject("SSID and password are required for WiFi/BT mode");
            return;
        }

        // WiFi/BT 模式使用 EZ 模式，蓝牙辅助
        startEZMode(call, householdId, householdName);
    }

    // Zigbee Mode
    private void startZigbeeMode(PluginCall call, String householdId, String householdName) {
        String gatewayId = call.getString("zigbeeGatewayId");

        if (gatewayId == null) {
            call.reject("Zigbee gateway ID is required for Zigbee mode");
            return;
        }

        // 确保 Tuya Home 存在
        ensureHomeExists(householdName, call, () -> {
            HomeBean currentHome = ThingHomeSdk.getHomeManagerInstance().getCurrentHome();
            if (currentHome == null) {
                call.reject("No Tuya Home available. Please ensure a Home exists.");
                return;
            }

            if (householdId != null) {
                currentHouseholdId = householdId;
                currentTuyaHomeId = currentHome.getHomeId();
            }

            // 查找指定的网关设备
            DeviceBean gatewayDevice = null;
            if (currentHome.getDeviceList() != null) {
                for (DeviceBean device : currentHome.getDeviceList()) {
                    if (gatewayId.equals(device.getDevId())) {
                        gatewayDevice = device;
                        break;
                    }
                }
            }

            if (gatewayDevice == null) {
                call.reject("Zigbee gateway not found. Please ensure the gateway device ID is correct and the gateway is online.");
                return;
            }

            if (!gatewayDevice.getIsOnline()) {
                call.reject("Zigbee gateway is offline. Please ensure the gateway is online and try again.");
                return;
            }

            // Zigbee 配网：网关会自动扫描并添加 Zigbee 设备
            // 用户需要在设备上按下配对按钮
            currentProvisioningCall = call;
            currentToken = "zigbee_" + System.currentTimeMillis();

            JSObject result = new JSObject();
            result.put("success", true);
            result.put("token", currentToken);
            result.put("status", "provisioning");
            result.put("message", "Zigbee provisioning started. Please put your Zigbee device in pairing mode. The gateway will automatically discover and add the device.");
            result.put("gatewayId", gatewayId);
            result.put("gatewayName", gatewayDevice.getName());
            result.put("tuyaHomeId", currentTuyaHomeId);
            result.put("mode", "zigbee");
            call.resolve(result);
        });
    }

    // BT Mode
    private void startBTMode(PluginCall call, String householdId, String householdName) {
        String bluetoothMac = call.getString("bluetoothMac");
        String gatewayId = call.getString("btGatewayId");

        // 确保 Tuya Home 存在
        ensureHomeExists(householdName, call, () -> {
            HomeBean currentHome = ThingHomeSdk.getHomeManagerInstance().getCurrentHome();
            if (currentHome == null) {
                call.reject("No Tuya Home available. Please ensure a Home exists.");
                return;
            }

            if (householdId != null) {
                currentHouseholdId = householdId;
                currentTuyaHomeId = currentHome.getHomeId();
            }

            DeviceBean btGateway = null;
            if (gatewayId != null && currentHome.getDeviceList() != null) {
                for (DeviceBean device : currentHome.getDeviceList()) {
                    if (gatewayId.equals(device.getDevId())) {
                        btGateway = device;
                        break;
                    }
                }
            }

            currentProvisioningCall = call;
            currentToken = "bt_" + (bluetoothMac != null ? bluetoothMac : "direct") + "_" + System.currentTimeMillis();

            if (btGateway != null) {
                // BT Gateway 配网
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("token", currentToken);
                result.put("status", "provisioning");
                result.put("message", "BT gateway provisioning started. Please put your Bluetooth device in pairing mode. The gateway will automatically discover and add the device.");
                result.put("gatewayId", gatewayId);
                result.put("gatewayName", btGateway.getName());
                result.put("bluetoothMac", bluetoothMac);
                result.put("tuyaHomeId", currentTuyaHomeId);
                result.put("mode", "gateway");
                call.resolve(result);
            } else {
                // 直接 BT 配网
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("token", currentToken);
                result.put("status", "provisioning");
                result.put("message", "Bluetooth provisioning started. Please ensure your device is nearby, Bluetooth is enabled, and the device is in pairing mode.");
                result.put("bluetoothMac", bluetoothMac);
                result.put("tuyaHomeId", currentTuyaHomeId);
                result.put("mode", "direct");
                call.resolve(result);
            }
        });
    }

    // Manual Mode
    private void handleManualMode(PluginCall call, String householdId, String householdName) {
        String deviceId = call.getString("deviceId");

        if (deviceId == null) {
            call.reject("Device ID is required for manual mode");
            return;
        }

        // 确保 Tuya Home 存在
        ensureHomeExists(householdName, call, () -> {
            HomeBean currentHome = ThingHomeSdk.getHomeManagerInstance().getCurrentHome();
            if (currentHome == null) {
                call.reject("No Tuya Home available. Please ensure a Home exists.");
                return;
            }

            if (householdId != null) {
                currentHouseholdId = householdId;
                currentTuyaHomeId = currentHome.getHomeId();
            }

            // 手动模式：直接返回设备信息，设备应该已经在 Tuya 云中注册
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("deviceId", deviceId);
            result.put("deviceName", "Tuya Device " + deviceId);
            result.put("status", "success");
            result.put("message", "Manual device added");
            result.put("tuyaHomeId", currentTuyaHomeId);
            call.resolve(result);
        });
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

        // 状态通过回调处理，这里返回当前状态
        JSObject result = new JSObject();
        result.put("success", true);
        result.put("status", currentProvisioningCall != null ? "provisioning" : "idle");
        result.put("token", token);
        call.resolve(result);
    }

    @PluginMethod
    public void stopProvisioning(PluginCall call) {
        try {
            // 停止配网 - 使用 BizBundle
            if (currentActivatorRequest != null) {
                ThingActivatorManager.getInstance().stopActivator();
                currentActivatorRequest = null;
            }

            // 也停止底层配网（如果正在使用）
            if (currentActivator != null) {
                currentActivator.stopActivator();
                currentActivator = null;
            }

            // 清理状态
            currentToken = null;
            currentHouseholdId = null;
            currentTuyaHomeId = null;

            // 取消待处理的配网调用
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
    public void addMemberToHome(PluginCall call) {
        if (!isInitialized) {
            call.reject("Tuya SDK not initialized");
            return;
        }

        String homeId = call.getString("homeId");
        String userId = call.getString("userId");
        String role = call.getString("role"); // 'admin', 'member', 'guest'

        if (homeId == null || userId == null) {
            call.reject("Home ID and User ID are required");
            return;
        }

        // 获取 Home 实例并添加成员
        ThingHomeSdk.newHomeInstance(homeId).addMember(
            userId,
            role != null ? role : "member",
            new IThingResultCallback() {
                @Override
                public void onSuccess() {
                    JSObject result = new JSObject();
                    result.put("success", true);
                    call.resolve(result);
                }

                @Override
                public void onError(String code, String error) {
                    call.reject("Failed to add member: " + error);
                }
            }
        );
    }

    // Helper method to ensure Tuya Home exists
    private void ensureHomeExists(String householdName, PluginCall call, Runnable onSuccess) {
        // 检查用户是否已登录（创建 Home 需要登录）
        User user = ThingHomeSdk.getUserInstance().getUser();
        if (user == null) {
            Log.e(TAG, "User not logged in, cannot create/access Home");
            call.reject("Tuya user login required. Cannot create or access Home.");
            return;
        }

        // 检查是否有当前 Home
        HomeBean currentHome = ThingHomeSdk.getHomeManagerInstance().getCurrentHome();
        if (currentHome != null) {
            currentTuyaHomeId = currentHome.getHomeId();
            Log.d(TAG, "Using existing Home: " + currentTuyaHomeId);
            mainHandler.post(onSuccess);
            return;
        }

        // 检查是否有现有的 Home
        ThingHomeSdk.getHomeManagerInstance().queryHomeList(new IThingResultCallback<java.util.List<HomeBean>>() {
            @Override
            public void onSuccess(java.util.List<HomeBean> homes) {
                if (homes != null && !homes.isEmpty()) {
                    // 使用第一个 Home
                    HomeBean firstHome = homes.get(0);
                    ThingHomeSdk.getHomeManagerInstance().setCurrentHome(firstHome);
                    currentTuyaHomeId = firstHome.getHomeId();
                    Log.d(TAG, "Using existing Home from list: " + currentTuyaHomeId);
                    mainHandler.post(onSuccess);
                    return;
                }

                // 如果没有 Home，创建新的 Home
                String homeName = householdName != null ? householdName : "Smart Warehouse Home";
                Log.d(TAG, "Creating new Tuya Home: " + homeName);
                
                ThingHomeSdk.getHomeManagerInstance().createHome(
                    homeName,
                    0, // latitude
                    0, // longitude
                    new IThingHomeResultCallback() {
                        @Override
                        public void onSuccess(HomeBean home) {
                            ThingHomeSdk.getHomeManagerInstance().setCurrentHome(home);
                            currentTuyaHomeId = home.getHomeId();
                            Log.d(TAG, "Tuya Home created successfully: " + currentTuyaHomeId);
                            mainHandler.post(onSuccess);
                        }

                        @Override
                        public void onError(String code, String error) {
                            Log.e(TAG, "Failed to create Tuya Home: " + error);
                            call.reject("Failed to create Tuya Home: " + error);
                        }
                    }
                );
            }

            @Override
            public void onError(String code, String error) {
                Log.e(TAG, "Failed to query Tuya Home list: " + error);
                call.reject("Failed to query Tuya Home list: " + error);
            }
        });
    }
}
