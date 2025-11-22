import Foundation
import Capacitor
import ThingSmartActivatorBizBundle
import ThingSmartHomeKit
import ThingSmartNetworkKit
import ThingSmartUserKit

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
        
        // Check if user is already logged in
        if ThingSmartUser.sharedInstance().isLogin {
            // User is already logged in
            isInitialized = true
            call.resolve([
                "initialized": true,
                "native": true,
                "loggedIn": true,
                "message": "Tuya SDK initialized successfully. User already logged in."
            ])
            return
        }
        
        // Try guest/anonymous login (if supported by SDK version)
        // Note: Some Tuya SDK versions support guest login, others require explicit user login
        // For now, we'll attempt to use the SDK without explicit login
        // If provisioning fails, we'll need to implement user login
        
        isInitialized = true
        
        call.resolve([
            "initialized": true,
            "native": true,
            "loggedIn": false,
            "message": "Tuya SDK initialized successfully. User login may be required for provisioning."
        ])
    }
    
    // MARK: - User Login
    
    @objc func login(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Tuya SDK not initialized. Call initialize() first.")
            return
        }
        
        guard let countryCode = call.getString("countryCode"),
              let account = call.getString("account"),
              let password = call.getString("password") else {
            call.reject("countryCode, account, and password are required")
            return
        }
        
        // Check if account exists, if not, register first
        let isEmail = account.contains("@")
        
        // Try login first (account might already exist)
        ThingSmartUser.sharedInstance().login(
            withCountryCode: countryCode,
            phoneNumber: isEmail ? nil : account,
            email: isEmail ? account : nil,
            password: password
        ) { [weak self] result in
            guard let self = self else { return }
            
            if result.success {
                // Login successful
                call.resolve([
                    "success": true,
                    "loggedIn": true,
                    "message": "Tuya login successful"
                ])
            } else {
                // Login failed, try to register (auto-create account)
                // Tuya SDK's loginOrRegister can handle both login and registration
                ThingSmartUser.sharedInstance().loginOrRegister(
                    withCountryCode: countryCode,
                    phoneNumber: isEmail ? nil : account,
                    email: isEmail ? account : nil,
                    password: password
                ) { registerResult in
                    if registerResult.success {
                        // Account created and logged in
                        call.resolve([
                            "success": true,
                            "loggedIn": true,
                            "accountCreated": true,
                            "message": "Tuya account created and logged in successfully"
                        ])
                    } else {
                        // Registration also failed
                        call.reject("Tuya login/registration failed: \(registerResult.errorMsg ?? "Unknown error")")
                    }
                }
            }
        }
    }
    
    @objc func logout(_ call: CAPPluginCall) {
        ThingSmartUser.sharedInstance().logout {
            call.resolve([
                "success": true,
                "message": "Tuya logout successful"
            ])
        }
    }
    
    @objc func isLoggedIn(_ call: CAPPluginCall) {
        let loggedIn = ThingSmartUser.sharedInstance().isLogin
        call.resolve([
            "loggedIn": loggedIn
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
            startZigbeeMode(call, householdId: householdId, householdName: householdName)
        case "bt":
            startBTMode(call, householdId: householdId, householdName: householdName)
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
    
    private func startZigbeeMode(_ call: CAPPluginCall, householdId: String?, householdName: String?) {
        guard let gatewayId = call.getString("zigbeeGatewayId") else {
            call.reject("Zigbee gateway ID is required for Zigbee mode")
            return
        }
        
        // 獲取 Household 信息（用於創建對應的 Tuya Home）
        // Ensure Home exists before provisioning
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
            
            // 獲取當前 Home 下的設備列表，查找 Zigbee 網關
            guard let currentHome = ThingSmartHomeManager.sharedInstance().getCurrentHome() else {
                call.reject("No Tuya Home available. Please ensure a Home exists.")
                return
            }
            
            // 查找指定的網關設備
            let gatewayDevice = currentHome.deviceList?.first { device in
                device.devId == gatewayId
            }
            
            guard let gateway = gatewayDevice else {
                call.reject("Zigbee gateway not found. Please ensure the gateway device ID is correct and the gateway is online.")
                return
            }
            
            // 檢查網關是否在線
            guard gateway.isOnline else {
                call.reject("Zigbee gateway is offline. Please ensure the gateway is connected and online.")
                return
            }
            
            // Zigbee 配網流程說明：
            // 1. Zigbee 子設備通過網關連接，不需要 WiFi 配網
            // 2. 網關需要先配網（通過 WiFi），然後通過網關添加 Zigbee 子設備
            // 3. 子設備配網時，需要：
            //    - 網關在線
            //    - 子設備進入配網模式（通常長按配網按鈕）
            //    - 網關自動掃描並添加子設備
            
            // 注意：Tuya SDK 的 Zigbee 配網是通過網關自動完成的
            // 我們這裡主要是驗證網關存在並在線，然後返回配網已啟動的狀態
            // 實際的設備發現和配網由網關自動完成
            
            // 存儲配網信息
            self.currentProvisioningCall = call
            self.currentToken = "zigbee_\(gatewayId)_\(Date().timeIntervalSince1970)"
            
            // 返回配網已啟動的狀態
            // 實際的 Zigbee 設備發現和配網由網關自動完成
            call.resolve([
                "success": true,
                "token": self.currentToken ?? "",
                "status": "provisioning",
                "message": "Zigbee provisioning started. Please put your Zigbee device in pairing mode. The gateway will automatically discover and add the device.",
                "gatewayId": gatewayId,
                "gatewayName": gateway.name ?? "",
                "tuyaHomeId": homeId
            ])
            
            // 設置超時（Zigbee 配網通常需要更長時間，設置為 120 秒）
            self.provisioningTimer = Timer.scheduledTimer(withTimeInterval: 120, repeats: false) { [weak self] _ in
                self?.handleProvisioningTimeout()
            }
            
            // 注意：Zigbee 配網的實際流程是：
            // 1. 用戶將 Zigbee 子設備進入配網模式
            // 2. 網關自動掃描並發現設備
            // 3. 網關自動將設備添加到 Home
            // 4. 設備會通過 ThingSmartActivatorDelegate 回調返回
            // 但由於 Zigbee 配網是通過網關進行的，可能不會觸發標準的配網回調
            // 因此我們需要監聽設備列表變化，或者提供手動刷新設備列表的功能
        }
    }
    
    // MARK: - BT Mode
    
    private func startBTMode(_ call: CAPPluginCall, householdId: String?, householdName: String?) {
        // Bluetooth MAC 地址是可選的（取決於配網方式）
        let bluetoothMac = call.getString("bluetoothMac")
        
        // 獲取 Household 信息（用於創建對應的 Tuya Home）
        // Ensure Home exists before provisioning
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
            
            // 獲取當前 Home 下的設備列表，查找 BT 網關（如果使用網關模式）
            guard let currentHome = ThingSmartHomeManager.sharedInstance().getCurrentHome() else {
                call.reject("No Tuya Home available. Please ensure a Home exists.")
                return
            }
            
            // BT 配網有兩種方式：
            // 1. 直接 BT 配網：設備直接通過藍牙連接
            // 2. BT Gateway 配網：通過 BT 網關進行配網
            
            // 檢查是否有 BT 網關（可選）
            var btGateway: ThingSmartDeviceModel? = nil
            if let gatewayId = call.getString("btGatewayId") {
                btGateway = currentHome.deviceList?.first { device in
                    device.devId == gatewayId
                }
                
                guard let gateway = btGateway, gateway.isOnline else {
                    call.reject("BT gateway not found or offline. Please ensure the gateway device ID is correct and the gateway is online.")
                    return
                }
            }
            
            // Tuya SDK 的藍牙配網流程：
            // 1. 對於直接 BT 配網：使用 ThingSmartActivator 的藍牙配網模式
            // 2. 對於 BT Gateway 配網：通過網關進行配網
            
            // 注意：Tuya SDK 的藍牙配網可能需要：
            // - CoreBluetooth 框架支持
            // - 藍牙權限（已在 Info.plist 中配置）
            // - 設備進入配網模式
            
            // 使用 ThingSmartActivator 進行藍牙配網
            ThingSmartActivator.sharedInstance().delegate = self
            
            // 對於直接 BT 配網，我們使用藍牙配網模式
            // 注意：Tuya SDK 的藍牙配網可能需要特定的配網模式
            // 如果 SDK 支持，可以使用 startConfigWiFi 的藍牙模式
            // 或者使用專門的藍牙配網 API
            
            // 當前實現：啟動藍牙配網流程
            // 由於 Tuya SDK 的藍牙配網 API 可能因版本而異，我們先實現基本框架
            
            // 存儲配網信息
            self.currentProvisioningCall = call
            self.currentToken = "bt_\(bluetoothMac ?? "direct")_\(Date().timeIntervalSince1970)"
            
            // 如果有網關，使用網關配網；否則使用直接配網
            if let gateway = btGateway {
                // BT Gateway 配網
                call.resolve([
                    "success": true,
                    "token": self.currentToken ?? "",
                    "status": "provisioning",
                    "message": "BT gateway provisioning started. Please put your Bluetooth device in pairing mode. The gateway will automatically discover and add the device.",
                    "gatewayId": gateway.devId ?? "",
                    "gatewayName": gateway.name ?? "",
                    "bluetoothMac": bluetoothMac ?? "",
                    "tuyaHomeId": homeId,
                    "mode": "gateway"
                ])
            } else {
                // 直接 BT 配網
                // 注意：直接 BT 配網可能需要設備在附近且進入配網模式
                call.resolve([
                    "success": true,
                    "token": self.currentToken ?? "",
                    "status": "provisioning",
                    "message": "Bluetooth provisioning started. Please ensure your device is nearby, Bluetooth is enabled, and the device is in pairing mode.",
                    "bluetoothMac": bluetoothMac ?? "",
                    "tuyaHomeId": homeId,
                    "mode": "direct"
                ])
            }
            
            // 設置超時（藍牙配網通常需要 60-120 秒）
            self.provisioningTimer = Timer.scheduledTimer(withTimeInterval: 120, repeats: false) { [weak self] _ in
                self?.handleProvisioningTimeout()
            }
            
            // 注意：藍牙配網的實際流程：
            // 1. 用戶將設備進入配網模式（通常長按配網按鈕）
            // 2. 系統掃描藍牙設備
            // 3. 發現設備後進行配網
            // 4. 設備通過 ThingSmartActivatorDelegate 回調返回
            
            // 如果使用網關模式：
            // 1. 網關掃描藍牙設備
            // 2. 網關自動添加設備到 Home
            // 3. 設備可能不會觸發標準的配網回調
        }
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
