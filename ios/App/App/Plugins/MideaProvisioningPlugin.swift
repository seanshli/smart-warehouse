import Foundation
import Capacitor
import MSmartSDK

@objc(MideaProvisioningPlugin)
public class MideaProvisioningPlugin: CAPPlugin {
    private var isInitialized = false
    private var currentToken: String?
    private var currentProvisioningCall: CAPPluginCall?
    
    // MARK: - Initialize
    
    @objc func initialize(_ call: CAPPluginCall) {
        guard let clientId = call.getString("clientId"),
              let clientSecret = call.getString("clientSecret"),
              let serverHost = call.getString("serverHost") else {
            call.reject("Midea credentials are required: clientId, clientSecret, serverHost")
            return
        }
        
        let accessToken = call.getString("accessToken") ?? ""
        
        // Initialize MSmartSDK
        let config = MSConfig()
        config.clientId = clientId
        config.clientSecret = clientSecret
        config.serverHost = serverHost
        config.enableLog = true
        
        // Initialize SDK in OVERSEAS_OEM mode (海外OEM版)
        let initResult = MSInterface.shareInstance()?.initSDK(config, workMode: .overSeaOEM, extra: nil) ?? false
        
        if !initResult {
            call.reject("Failed to initialize Midea SDK")
            return
        }
        
        // Set access token if provided
        if !accessToken.isEmpty {
            let tokenSet = MSInterface.shareInstance()?.setAccessToken("Bearer \(accessToken)") ?? false
            if !tokenSet {
                call.reject("Failed to set access token")
                return
            }
        }
        
        // Set token refresh delegate
        MSInterface.shareInstance()?.setTokenRefreshDelegate(self)
        
        isInitialized = true
        
        call.resolve([
            "initialized": true,
            "native": true,
            "message": "Midea SDK initialized successfully"
        ])
    }
    
    // MARK: - Provisioning
    
    @objc func startProvisioning(_ call: CAPPluginCall) {
        if !isInitialized {
            call.reject("Midea SDK not initialized. Call initialize() first.")
            return
        }
        
        guard let mode = call.getString("mode"),
              mode.lowercased() == "ap" else {
            call.reject("Midea currently only supports AP mode provisioning")
            return
        }
        
        guard let deviceSsid = call.getString("deviceSsid"),
              let routerSsid = call.getString("ssid"),
              let routerPassword = call.getString("password") else {
            call.reject("Device SSID, Router SSID, and password are required for AP mode")
            return
        }
        
        let routerSecurityParams = call.getString("routerSecurityParams") ?? "[WPA2-PSK-CCMP][RSN-PSK-CCMP][ESS]"
        
        currentProvisioningCall = call
        currentToken = "midea_ap_\(Int(Date().timeIntervalSince1970 * 1000))"
        
        // Create AP config parameters
        let params = MSDeviceApConfigParams()
        params.deviceSSID = deviceSsid
        params.routerSSID = routerSsid
        params.routerPwd = routerPassword
        // routerBSSID is optional, can be nil
        params.routerBSSID = nil
        
        // Stop any existing provisioning
        MSDeviceConfigManager.shareInstance()?.stopConfigureDevice({ [weak self] error in
            // Ignore errors when stopping
        })
        
        // Start device configuration
        MSDeviceConfigManager.shareInstance()?.startConfigureDevice(
            params,
            configType: .ap,
            progressCallback: { [weak self] (apStep, bleStep) in
                guard let self = self else { return }
                
                // Report progress to JavaScript
                // Note: We can't directly notify from here, but we can store the step
                // The completion callback will be called when done
                print("Midea provisioning progress - AP Step: \(apStep), BLE Step: \(bleStep)")
            },
            completioncallback: { [weak self] (error, device) in
                guard let self = self else { return }
                
                DispatchQueue.main.async {
                    if let error = error {
                        // Provisioning failed
                        self.currentProvisioningCall?.reject(
                            error.localizedDescription,
                            nil,
                            [
                                "errorCode": error.code,
                                "status": "failed",
                                "token": self.currentToken ?? ""
                            ]
                        )
                        self.currentProvisioningCall = nil
                        self.currentToken = nil
                    } else if let device = device {
                        // Provisioning succeeded
                        var deviceInfo: [String: Any] = [:]
                        if let deviceId = device.deviceId {
                            deviceInfo["deviceId"] = deviceId
                        }
                        if let deviceName = device.deviceName {
                            deviceInfo["deviceName"] = deviceName
                        }
                        if let deviceType = device.deviceType {
                            deviceInfo["deviceType"] = deviceType
                        }
                        if let deviceSn = device.deviceSn {
                            deviceInfo["deviceSn"] = deviceSn
                        }
                        if let deviceSsid = device.deviceSsid {
                            deviceInfo["deviceSsid"] = deviceSsid
                        }
                        
                        self.currentProvisioningCall?.resolve([
                            "success": true,
                            "deviceId": device.deviceId ?? "",
                            "deviceName": device.deviceName ?? "",
                            "status": "success",
                            "token": self.currentToken ?? "",
                            "deviceInfo": deviceInfo
                        ])
                        self.currentProvisioningCall = nil
                        self.currentToken = nil
                    } else {
                        // Unexpected: no error but no device
                        self.currentProvisioningCall?.reject(
                            "Provisioning completed but no device information received",
                            nil,
                            [
                                "status": "failed",
                                "token": self.currentToken ?? ""
                            ]
                        )
                        self.currentProvisioningCall = nil
                        self.currentToken = nil
                    }
                }
            }
        )
        
        // Return immediately with provisioning status
        call.resolve([
            "success": true,
            "token": currentToken ?? "",
            "status": "provisioning",
            "message": "Midea AP mode provisioning started",
            "mode": "ap"
        ])
    }
    
    @objc func getStatus(_ call: CAPPluginCall) {
        let token = call.getString("token") ?? currentToken
        
        guard let token = token else {
            call.reject("Provisioning token is required")
            return
        }
        
        call.resolve([
            "success": true,
            "status": currentProvisioningCall != nil ? "provisioning" : "idle",
            "token": token
        ])
    }
    
    @objc func stopProvisioning(_ call: CAPPluginCall) {
        MSDeviceConfigManager.shareInstance()?.stopConfigureDevice { [weak self] error in
            guard let self = self else { return }
            
            DispatchQueue.main.async {
                self.currentToken = nil
                
                if let provisioningCall = self.currentProvisioningCall {
                    provisioningCall.reject("Provisioning stopped by user")
                    self.currentProvisioningCall = nil
                }
                
                if let error = error {
                    call.reject("Failed to stop provisioning: \(error.localizedDescription)")
                } else {
                    call.resolve([
                        "success": true,
                        "message": "Provisioning stopped"
                    ])
                }
            }
        }
    }
    
    @objc func resumeProvisioning(_ call: CAPPluginCall) {
        MSDeviceConfigManager.shareInstance()?.resumeConfigureDevice()
        
        call.resolve([
            "success": true,
            "message": "Provisioning resumed"
        ])
    }
}

// MARK: - MSRefreshDelegate

extension MideaProvisioningPlugin: MSRefreshDelegate {
    @objc public func refreshToken(_ competion: @escaping MSRefreshTokenBlock) {
        // Token refresh should be handled by the app
        // For now, just call the completion with false to indicate refresh failed
        // The app should implement token refresh logic
        // TODO: Implement actual token refresh logic
        competion(false)
    }
}
