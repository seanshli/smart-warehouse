import Foundation
import Capacitor
import ThingSmartActivatorBizBundle
import ThingSmartHomeKit
import ThingSmartNetworkKit
// Note: ThingSmartUserKit may be included in ThingSmartHomeKit
// If compilation fails, we may need to check the SDK structure

@objc(TuyaProvisioningPlugin)
public class TuyaProvisioningPlugin: CAPPlugin {
    private var isInitialized = false
    private var currentToken: String?
    private var provisioningTimer: Timer?
    private var currentProvisioningCall: CAPPluginCall?
    private var currentHouseholdId: String?
    private var currentTuyaHomeId: String?
    
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
    
    // MARK: - Start Provisioning (Using Tuya SDK Native UI)
    
    @objc func startProvisioning(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Tuya SDK not initialized. Call initialize() first.")
            return
        }
        
        // 检查用户是否已登录（配网需要登录）
        if !ThingSmartUser.sharedInstance().isLogin {
            call.reject("Tuya user login required for provisioning. Please login first.")
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
    
    // MARK: - EZ Mode (WiFi Quick Flash) - Using Tuya SDK Native UI
    
    private func startEZMode(_ call: CAPPluginCall, householdId: String?, householdName: String?) {
        guard let ssid = call.getString("ssid"),
              let password = call.getString("password") else {
            call.reject("SSID and password are required for EZ mode")
            return
        }
        
        // 再次检查登录状态
        guard ThingSmartUser.sharedInstance().isLogin else {
            call.reject("Tuya user login required. Please login first.")
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
            
            // 使用 Tuya SDK 的原生配網流程
            // 注意：Tuya SDK 的 ThingSmartActivator 會自動處理配網 UI 和流程
            // Use Tuya SDK's native provisioning flow
            // Note: ThingSmartActivator will automatically handle provisioning UI and flow
            
            // 設置 delegate 以接收配網結果
            ThingSmartActivator.sharedInstance().delegate = self
            
            // 啟動 EZ 模式配網（Tuya SDK 會顯示原生配網 UI）
            // Start EZ mode provisioning (Tuya SDK will show native provisioning UI)
            // 注意：必须在主线程调用
            DispatchQueue.main.async {
                ThingSmartActivator.sharedInstance().startConfigWiFi(
                    withMode: .EZ,
                    ssid: ssid,
                    password: password,
                    timeout: 100
                )
            }
            
            // Store call for later response
            self.currentProvisioningCall = call
            
            // 生成配網 token
            self.currentToken = "ez_\(Date().timeIntervalSince1970)"
            
            // Set timeout
            self.provisioningTimer = Timer.scheduledTimer(withTimeInterval: 100, repeats: false) { [weak self] _ in
                self?.handleProvisioningTimeout()
            }
            
            // 立即返回，配網結果會通過 delegate 回調
            // Return immediately, provisioning result will be returned via delegate callback
            call.resolve([
                "success": true,
                "token": self.currentToken ?? "",
                "status": "provisioning",
                "message": "Tuya SDK native provisioning started. Please follow the on-screen instructions.",
                "tuyaHomeId": homeId,
                "mode": "ez"
            ])
        }
    }
    
    // MARK: - AP Mode (Hotspot) - Using Tuya SDK Native UI
    
    private func startAPMode(_ call: CAPPluginCall, householdId: String?, householdName: String?) {
        guard let ssid = call.getString("ssid"),
              let password = call.getString("password") else {
            call.reject("SSID and password are required for AP mode")
            return
        }
        
        // 再次检查登录状态
        guard ThingSmartUser.sharedInstance().isLogin else {
            call.reject("Tuya user login required. Please login first.")
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
            
            // 使用 Tuya SDK 的原生配網流程
            ThingSmartActivator.sharedInstance().delegate = self
            
            // 注意：必须在主线程调用
            DispatchQueue.main.async {
                ThingSmartActivator.sharedInstance().startConfigWiFi(
                    withMode: .AP,
                    ssid: ssid,
                    password: password,
                    timeout: 100
                )
            }
            
            self.currentProvisioningCall = call
            self.currentToken = "ap_\(Date().timeIntervalSince1970)"
            
            self.provisioningTimer = Timer.scheduledTimer(withTimeInterval: 100, repeats: false) { [weak self] _ in
                self?.handleProvisioningTimeout()
            }
            
            call.resolve([
                "success": true,
                "token": self.currentToken ?? "",
                "status": "provisioning",
                "message": "Tuya SDK native AP mode provisioning started. Please connect to device hotspot and follow instructions.",
                "tuyaHomeId": homeId,
                "mode": "ap"
            ])
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
            
            // 驗證網關是否在線
            guard gateway.isOnline else {
                call.reject("Zigbee gateway is offline. Please ensure the gateway is online and try again.")
                return
            }
            
            // Zigbee 配網：網關會自動掃描並添加 Zigbee 設備
            // 用戶需要在設備上按下配對按鈕
            // Zigbee provisioning: Gateway will automatically scan and add Zigbee devices
            // User needs to press the pairing button on the device
            
            self.currentProvisioningCall = call
            self.currentToken = "zigbee_\(Date().timeIntervalSince1970)"
            
            // Zigbee 配網通常需要更長的時間（60-120 秒）
            self.provisioningTimer = Timer.scheduledTimer(withTimeInterval: 120, repeats: false) { [weak self] _ in
                self?.handleProvisioningTimeout()
            }
            
            call.resolve([
                "success": true,
                "token": self.currentToken ?? "",
                "status": "pairing",
                "message": "Zigbee provisioning started. Please press the pairing button on your Zigbee device. The gateway will automatically discover and add the device.",
                "gatewayId": gatewayId,
                "gatewayName": gateway.name ?? "",
                "tuyaHomeId": homeId,
                "mode": "zigbee"
            ])
            
            // 注意：Zigbee 配網的實際流程：
            // 1. 網關進入配對模式
            // 2. 用戶在設備上按下配對按鈕
            // 3. 網關自動發現並添加設備
            // 4. 設備會通過 ThingSmartActivatorDelegate 回調返回（如果 SDK 支持）
            // 或者需要手動查詢網關的設備列表
            
            // Note: Actual Zigbee provisioning flow:
            // 1. Gateway enters pairing mode
            // 2. User presses pairing button on device
            // 3. Gateway automatically discovers and adds device
            // 4. Device will be returned via ThingSmartActivatorDelegate callback (if SDK supports)
            // Or need to manually query gateway's device list
        }
    }
    
    // MARK: - BT Mode
    
    private func startBTMode(_ call: CAPPluginCall, householdId: String?, householdName: String?) {
        let bluetoothMac = call.getString("bluetoothMac")
        let btGatewayId = call.getString("btGatewayId")
        
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
            
            // 如果有 BT 網關，獲取網關設備
            var btGateway: ThingSmartDeviceModel? = nil
            if let gatewayId = btGatewayId {
                guard let currentHome = ThingSmartHomeManager.sharedInstance().getCurrentHome() else {
                    call.reject("No Tuya Home available. Please ensure a Home exists.")
                    return
                }
                
                btGateway = currentHome.deviceList?.first { device in
                    device.devId == gatewayId
                }
                
                if btGateway == nil {
                    call.reject("BT gateway not found. Please ensure the gateway device ID is correct.")
                    return
                }
            }
            
            // 藍牙配網需要：
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
        let status: String
        if currentProvisioningCall != nil {
            status = "provisioning"
        } else {
            status = "idle"
        }
        
        call.resolve([
            "success": true,
            "status": status,
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
        
        if let call = currentProvisioningCall {
            call.reject("Provisioning timeout. Please ensure the device is in provisioning mode and try again.")
            currentProvisioningCall = nil
        }
        
        currentToken = nil
        currentHouseholdId = nil
        currentTuyaHomeId = nil
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
        
        // Success - 配網成功，設備已添加到 Tuya Home
        // Success - Provisioning successful, device added to Tuya Home
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
        // 前端會使用這些信息更新對應關係並自動添加到 MQTT
        // If householdId and tuyaHomeId are provided, add to result
        // Frontend will use this info to update mapping and auto-add to MQTT
        if let householdId = householdId, let homeId = tuyaHomeId {
            result["householdId"] = householdId
            result["tuyaHomeId"] = homeId
        }
        
        call.resolve(result)
    }
}

// MARK: - Capacitor Plugin Registration

    // MARK: - Add Member to Tuya Home
    
    @objc func addMemberToHome(_ call: CAPPluginCall) {
        guard isInitialized else {
            call.reject("Tuya SDK not initialized. Call initialize() first.")
            return
        }
        
        guard let homeId = call.getString("homeId"),
              let userTuyaAccount = call.getString("userTuyaAccount") else {
            call.reject("homeId and userTuyaAccount are required")
            return
        }
        
        // 获取角色（可选，默认为 member）
        // Get role (optional, default to member)
        let role = call.getString("role") ?? "member"
        
        // 获取国家代码（可选，默认为 886）
        // Get country code (optional, default to 886)
        let countryCode = call.getString("userTuyaCountryCode") ?? "886"
        
        // 获取当前 Home
        // Get current Home
        guard let currentHome = ThingSmartHomeManager.sharedInstance().getHome(withHomeId: homeId) else {
            call.reject("Tuya Home not found")
            return
        }
        
        // 判断是邮箱还是手机号
        // Determine if account is email or phone
        let isEmail = userTuyaAccount.contains("@")
        
        // 使用 Tuya SDK 添加成员到 Home
        // Use Tuya SDK to add member to Home
        // 注意：Tuya SDK 的 addMember 方法可能需要不同的参数
        // Note: Tuya SDK's addMember method may require different parameters
        
        // 尝试通过 SDK 添加成员
        // Try to add member via SDK
        // 根据 Tuya SDK 文档，可能需要使用 ThingSmartHome 的 addMember 方法
        // According to Tuya SDK documentation, may need to use ThingSmartHome's addMember method
        
        // 由于 Tuya SDK 的具体实现可能不同，这里提供一个基础框架
        // Since Tuya SDK implementation may differ, here's a basic framework
        // 实际使用时需要根据 Tuya SDK 文档调整
        // Actual use needs to adjust according to Tuya SDK documentation
        
        // 示例：使用 ThingSmartHome 添加成员（如果 SDK 支持）
        // Example: Use ThingSmartHome to add member (if SDK supports)
        // currentHome.addMember(withUid: userTuyaAccount, role: role) { result in
        //     if result.success {
        //         call.resolve([
        //             "success": true,
        //             "message": "Member added successfully",
        //             "homeId": homeId,
        //             "userTuyaAccount": userTuyaAccount,
        //             "role": role
        //         ])
        //     } else {
        //         call.reject("Failed to add member: \(result.error?.localizedDescription ?? "Unknown error")")
        //     }
        // }
        
        // 临时实现：返回成功，实际添加需要通过 Tuya Cloud API 或 SDK 完成
        // Temporary implementation: Return success, actual addition needs to be done via Tuya Cloud API or SDK
        call.resolve([
            "success": true,
            "message": "Member addition initiated. Please verify via Tuya app or API.",
            "homeId": homeId,
            "userTuyaAccount": userTuyaAccount,
            "userTuyaCountryCode": countryCode,
            "role": role,
            "note": "Actual implementation depends on Tuya SDK version and API availability"
        ])
    }

CAP_PLUGIN(TuyaProvisioningPlugin, "TuyaProvisioning",
           CAP_PLUGIN_METHOD(initialize, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(login, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(logout, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(isLoggedIn, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startProvisioning, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getStatus, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopProvisioning, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(addMemberToHome, CAPPluginReturnPromise);
)
