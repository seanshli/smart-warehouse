import Foundation
import Capacitor
import ThingSmartActivatorBizBundle
import ThingSmartHomeKit
import ThingSmartNetworkKit

@objc(TuyaProvisioningPlugin)
public class TuyaProvisioningPlugin: CAPPlugin {
    private var isInitialized = false
    private var currentToken: String?
    private var provisioningTimer: Timer?
    private var currentProvisioningCall: CAPPluginCall?
    
    // MARK: - Initialize
    
    @objc func initialize(_ call: CAPPluginCall) {
        // Get credentials from call parameters (passed from JS/TypeScript)
        // The JS side should read from environment variables and pass them here
        guard let appKey = call.getString("appKey"),
              let appSecret = call.getString("appSecret") else {
            call.reject("Tuya AppKey and AppSecret are required. Pass them as parameters: { appKey: '...', appSecret: '...' }")
            return
        }
        
        // Initialize Tuya SDK
        ThingSmartSDK.sharedInstance().start(withAppKey: appKey, secretKey: appSecret)
        
        isInitialized = true
        
        call.resolve([
            "initialized": true,
            "native": true,
            "message": "Tuya SDK initialized successfully"
        ])
    }
    
    // MARK: - Start Provisioning
    
    @objc func startProvisioning(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Tuya SDK not initialized. Call initialize() first.")
            return
        }
        
        guard let mode = call.getString("mode") else {
            call.reject("Provisioning mode is required")
            return
        }
        
        // 獲取 Household 信息（用於創建對應的 Tuya Home）
        let householdId = call.getString("householdId")
        let householdName = call.getString("householdName")
        
        // Handle different provisioning modes
        switch mode.lowercased() {
        case "wifi", "ez":
            startEZMode(call, householdId: householdId, householdName: householdName)
        case "hotspot", "ap":
            startAPMode(call, householdId: householdId, householdName: householdName)
        case "wifi/bt":
            startWiFiBTMode(call, householdId: householdId, householdName: householdName)
        case "zigbee":
            startZigbeeMode(call)
        case "bt":
            startBTMode(call)
        case "manual":
            handleManualMode(call, householdId: householdId, householdName: householdName)
        case "auto":
            // Default to EZ mode for auto
            startEZMode(call, householdId: householdId, householdName: householdName)
        default:
            call.reject("Unsupported provisioning mode: \(mode)")
        }
    }
    
    // MARK: - EZ Mode (WiFi Quick Flash)
    
    private func startEZMode(_ call: CAPPluginCall, householdId: String?, householdName: String?) {
        guard let ssid = call.getString("ssid"),
              let password = call.getString("password") else {
            call.reject("SSID and password are required for EZ mode")
            return
        }
        
        // Ensure Home exists before provisioning (使用 Household 名稱)
        ensureHomeExists(householdName: householdName) { [weak self] homeId in
            guard let self = self, let homeId = homeId else {
                call.reject("Failed to create or access Tuya Home. Please try again.")
                return
            }
            
            // 存儲 Household 信息（用於配網成功後返回）
            if let householdId = householdId {
                self.currentHouseholdId = householdId
                self.currentTuyaHomeId = homeId
            }
            
            // Start EZ mode provisioning
            ThingSmartActivator.sharedInstance().delegate = self
            ThingSmartActivator.sharedInstance().startConfigWiFi(
                withMode: .EZ,
                ssid: ssid,
                password: password,
                timeout: 100
            )
            
            // Store call for later response
            self.currentProvisioningCall = call
            
            // Set timeout
            self.provisioningTimer = Timer.scheduledTimer(withTimeInterval: 100, repeats: false) { [weak self] _ in
                self?.handleProvisioningTimeout()
            }
        }
    }
    
    // MARK: - AP Mode (Hotspot)
    
    private func startAPMode(_ call: CAPPluginCall, householdId: String?, householdName: String?) {
        guard let ssid = call.getString("ssid"),
              let password = call.getString("password") else {
            call.reject("SSID and password are required for AP mode")
            return
        }
        
        // Ensure Home exists before provisioning (使用 Household 名稱)
        ensureHomeExists(householdName: householdName) { [weak self] homeId in
            guard let self = self, let homeId = homeId else {
                call.reject("Failed to create or access Tuya Home. Please try again.")
                return
            }
            
            // 存儲 Household 信息（用於配網成功後返回）
            if let householdId = householdId {
                self.currentHouseholdId = householdId
                self.currentTuyaHomeId = homeId
            }
            
            ThingSmartActivator.sharedInstance().delegate = self
            ThingSmartActivator.sharedInstance().startConfigWiFi(
                withMode: .AP,
                ssid: ssid,
                password: password,
                timeout: 100
            )
            
            self.currentProvisioningCall = call
            
            self.provisioningTimer = Timer.scheduledTimer(withTimeInterval: 100, repeats: false) { [weak self] _ in
                self?.handleProvisioningTimeout()
            }
        }
    }
    
    // MARK: - WiFi/BT Mode
    
    private func startWiFiBTMode(_ call: CAPPluginCall, householdId: String?, householdName: String?) {
        guard let ssid = call.getString("ssid"),
              let password = call.getString("password") else {
            call.reject("SSID and password are required for WiFi/BT mode")
            return
        }
        
        // WiFi/BT mode uses EZ mode with Bluetooth assistance
        startEZMode(call, householdId: householdId, householdName: householdName)
    }
    
    // MARK: - Zigbee Mode
    
    private func startZigbeeMode(_ call: CAPPluginCall) {
        guard let gatewayId = call.getString("zigbeeGatewayId") else {
            call.reject("Zigbee gateway ID is required for Zigbee mode")
            return
        }
        
        // Zigbee provisioning requires gateway
        call.reject("Zigbee mode provisioning requires additional gateway setup. Not yet implemented.")
    }
    
    // MARK: - BT Mode
    
    private func startBTMode(_ call: CAPPluginCall) {
        guard let bluetoothMac = call.getString("bluetoothMac") else {
            call.reject("Bluetooth MAC address is required for BT mode")
            return
        }
        
        // Bluetooth provisioning
        call.reject("Bluetooth mode provisioning not yet implemented in native SDK.")
    }
    
    // MARK: - Manual Mode
    
    private func handleManualMode(_ call: CAPPluginCall, householdId: String?, householdName: String?) {
        guard let deviceId = call.getString("deviceId") else {
            call.reject("Device ID is required for manual mode")
            return
        }
        
        // 確保 Home 存在（手動模式也需要 Home）
        ensureHomeExists(householdName: householdName) { [weak self] homeId in
            guard let homeId = homeId else {
                call.reject("Failed to create or access Tuya Home. Please try again.")
                return
            }
            
            // 如果提供了 householdId，更新對應關係
            if let householdId = householdId {
                // 在配網成功後更新對應關係
                // 這裡先返回成功，對應關係會在後續更新
            }
            
            // For manual mode, we just return success with the device ID
            // The device should already be registered in Tuya cloud
            call.resolve([
                "success": true,
                "deviceId": deviceId,
                "status": "success",
                "message": "Manual device added",
                "tuyaHomeId": homeId
            ])
        }
    }
    
    // MARK: - Get Status
    
    @objc func getStatus(_ call: CAPPluginCall) {
        guard let token = call.getString("token") ?? currentToken else {
            call.reject("Provisioning token is required")
            return
        }
        
        // Status is handled via delegate callbacks
        // Return current status if available
        call.resolve([
            "success": true,
            "status": "provisioning",
            "token": token
        ])
    }
    
    // MARK: - Stop Provisioning
    
    @objc func stopProvisioning(_ call: CAPPluginCall) {
        ThingSmartActivator.sharedInstance().stopConfigWiFi()
        ThingSmartActivator.sharedInstance().delegate = nil
        
        provisioningTimer?.invalidate()
        provisioningTimer = nil
        currentToken = nil
        
        // 清理存儲的信息
        currentHouseholdId = nil
        currentTuyaHomeId = nil
        
        // Cancel any pending provisioning call
        if let pendingCall = currentProvisioningCall {
            pendingCall.reject("Provisioning stopped by user")
            currentProvisioningCall = nil
        }
        
        call.resolve([
            "success": true,
            "message": "Provisioning stopped"
        ])
    }
    
    // MARK: - Helper Methods
    
    /// 确保 Tuya Home 存在，如果不存在则自动创建
    /// 確保 Tuya Home 存在，如果不存在則自動創建
    /// 使用 Household 名稱作為 Home 名稱
    private func ensureHomeExists(householdName: String?, completion: @escaping (String?) -> Void) {
        // 檢查是否有當前 Home
        if let currentHome = ThingSmartHomeManager.sharedInstance().getCurrentHome() {
            completion(currentHome.homeId)
            return
        }
        
        // 檢查是否有現有的 Home（可能對應到其他 Household）
        if let homes = ThingSmartHomeManager.sharedInstance().getHomeList(), !homes.isEmpty {
            // 如果有現有 Home，使用第一個（用戶可以後續切換）
            let firstHome = homes[0]
            ThingSmartHomeManager.sharedInstance().setCurrentHome(firstHome)
            completion(firstHome.homeId)
            return
        }
        
        // 如果沒有 Home，創建新的 Home
        // 使用 Household 名稱，如果沒有則使用默認名稱
        let homeName = householdName ?? "Smart Warehouse Home"
        let homeModel = ThingSmartHomeModel()
        homeModel.name = homeName
        
        // 創建 Home
        ThingSmartHomeManager.sharedInstance().addHome(withHomeModel: homeModel, success: { home in
            // Home 創建成功，設置為當前 Home
            ThingSmartHomeManager.sharedInstance().setCurrentHome(home)
            completion(home.homeId)
        }, failure: { error in
            // Home 創建失敗
            print("Failed to create Tuya Home: \(error?.localizedDescription ?? "Unknown error")")
            completion(nil)
        })
    }
    
    /// 同步版本：确保 Home 存在（用于需要立即返回的场景）
    private func ensureHomeExistsSync() -> String? {
        // 检查是否有当前 Home
        if let currentHome = ThingSmartHomeManager.sharedInstance().getCurrentHome() {
            return currentHome.homeId
        }
        
        // 如果没有 Home，尝试获取第一个 Home
        if let homes = ThingSmartHomeManager.sharedInstance().getHomeList(), !homes.isEmpty {
            let firstHome = homes[0]
            ThingSmartHomeManager.sharedInstance().setCurrentHome(firstHome)
            return firstHome.homeId
        }
        
        // 如果没有任何 Home，返回 nil（需要异步创建）
        return nil
    }
    
    private func handleProvisioningTimeout() {
        ThingSmartActivator.sharedInstance().stopConfigWiFi()
        ThingSmartActivator.sharedInstance().delegate = nil
        
        provisioningTimer?.invalidate()
        provisioningTimer = nil
        
        if let call = currentProvisioningCall {
            call.reject("Provisioning timeout after 100 seconds")
            currentProvisioningCall = nil
        }
    }
}

// MARK: - ThingSmartActivatorDelegate

extension TuyaProvisioningPlugin: ThingSmartActivatorDelegate {
    public func activator(_ activator: ThingSmartActivator, didReceiveDevice deviceModel: ThingSmartDeviceModel, error: Error?) {
        provisioningTimer?.invalidate()
        provisioningTimer = nil
        
        guard let call = currentProvisioningCall else {
            return
        }
        
        // 獲取存儲的 householdId 和 tuyaHomeId
        let householdId = currentHouseholdId
        let tuyaHomeId = currentTuyaHomeId ?? ThingSmartHomeManager.sharedInstance().getCurrentHome()?.homeId
        
        // 清理存儲的信息
        currentProvisioningCall = nil
        currentHouseholdId = nil
        currentTuyaHomeId = nil
        
        if let error = error {
            call.reject("Provisioning failed: \(error.localizedDescription)")
            return
        }
        
        // Success
        var result: [String: Any] = [
            "success": true,
            "deviceId": deviceModel.devId ?? "",
            "deviceName": deviceModel.name ?? "",
            "status": "success",
            "deviceInfo": [
                "devId": deviceModel.devId ?? "",
                "name": deviceModel.name ?? "",
                "productId": deviceModel.productId ?? "",
                "isOnline": deviceModel.isOnline
            ]
        ]
        
        // 如果提供了 householdId 和 tuyaHomeId，添加到結果中
        // 前端會使用這些信息更新對應關係
        if let householdId = householdId, let homeId = tuyaHomeId {
            result["householdId"] = householdId
            result["tuyaHomeId"] = homeId
        }
        
        call.resolve(result)
    }
}

// MARK: - Capacitor Plugin Registration

CAP_PLUGIN(TuyaProvisioningPlugin, "TuyaProvisioning",
           CAP_PLUGIN_METHOD(initialize, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startProvisioning, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getStatus, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopProvisioning, CAPPluginReturnPromise);
)
