import Foundation
import Capacitor
import SystemConfiguration.CaptiveNetwork
import CoreLocation

/**
 * WiFi Plugin for iOS
 * Provides native WiFi scanning and password management
 */
@objc(WiFiPlugin)
public class WiFiPlugin: CAPPlugin {
    
    // MARK: - Get Current SSID
    
    @objc func getCurrentSSID(_ call: CAPPluginCall) {
        if #available(iOS 14.0, *) {
            // iOS 14+ requires different approach
            // We can't directly get SSID, but we can check if connected
            call.resolve([
                "ssid": getCurrentSSIDiOS14() ?? NSNull()
            ])
        } else {
            // iOS 13 and below
            if let ssid = getCurrentSSIDLegacy() {
                call.resolve(["ssid": ssid])
            } else {
                call.resolve(["ssid": NSNull()])
            }
        }
    }
    
    @available(iOS 14.0, *)
    private func getCurrentSSIDiOS14() -> String? {
        // iOS 14+ requires location permission and NEHotspotConfiguration
        // Try to get SSID using NEHotspotConfigurationManager
        // Note: This requires the app to have configured the network before
        // For getting current SSID, we still need to use CNCopyCurrentNetworkInfo
        // but it requires special entitlements and location permission
        
        // First, check if we have location permission
        let locationManager = CLLocationManager()
        let authStatus = locationManager.authorizationStatus
        
        if authStatus != .authorizedWhenInUse && authStatus != .authorizedAlways {
            // No location permission, can't get SSID on iOS 14+
            return nil
        }
        
        // Try legacy method (may still work if app has proper entitlements)
        return getCurrentSSIDLegacy()
    }
    
    private func getCurrentSSIDLegacy() -> String? {
        guard let interfaces = CNCopySupportedInterfaces() as? [String] else {
            return nil
        }
        
        for interface in interfaces {
            if let info = CNCopyCurrentNetworkInfo(interface as CFString) as? [String: Any],
               let ssid = info[kCNNetworkInfoKeySSID as String] as? String {
                return ssid
            }
        }
        
        return nil
    }
    
    // MARK: - Scan Networks
    
    @objc func scanNetworks(_ call: CAPPluginCall) {
        // Check permission first
        checkPermission { [weak self] granted in
            guard let self = self else {
                call.reject("Plugin instance deallocated")
                return
            }
            
            if !granted {
                call.reject("WiFi scan permission denied. Please grant location permission in device settings.")
                return
            }
            
            // Note: iOS doesn't provide a direct API to scan WiFi networks
            // We can only get the currently connected network
            // For full scanning, we need to use NEHotspotConfiguration (iOS 11+)
            // which requires special entitlements and may not work in all scenarios
            
            // Return current network if available
            var networks: [[String: Any]] = []
            
            if let ssid = self.getCurrentSSIDLegacy() {
                networks.append([
                    "ssid": ssid,
                    "isConnected": true
                ])
            }
            
            // For iOS 14+, we can't scan networks directly
            // The app would need to use NEHotspotConfiguration with special entitlements
            // This is a limitation of iOS security model
            
            call.resolve([
                "networks": networks
            ])
        }
    }
    
    // MARK: - Check Permission
    
    @objc func checkPermission(_ call: CAPPluginCall) {
        checkPermission { granted in
            call.resolve(["granted": granted])
        }
    }
    
    private func checkPermission(completion: @escaping (Bool) -> Void) {
        // WiFi scanning requires location permission on iOS
        let status = CLLocationManager.authorizationStatus()
        
        switch status {
        case .authorizedWhenInUse, .authorizedAlways:
            completion(true)
        case .notDetermined:
            // Request permission
            let manager = CLLocationManager()
            manager.requestWhenInUseAuthorization()
            // Note: This is async, so we'll check again after a delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                let newStatus = CLLocationManager.authorizationStatus()
                completion(newStatus == .authorizedWhenInUse || newStatus == .authorizedAlways)
            }
        default:
            completion(false)
        }
    }
    
    // MARK: - Request Permission
    
    @objc func requestPermission(_ call: CAPPluginCall) {
        let locationManager = CLLocationManager()
        locationManager.requestWhenInUseAuthorization()
        
        // Check status after a short delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            let status = CLLocationManager.authorizationStatus()
            call.resolve([
                "granted": status == .authorizedWhenInUse || status == .authorizedAlways
            ])
        }
    }
    
    // MARK: - Save Password
    
    @objc func savePassword(_ call: CAPPluginCall) {
        guard let ssid = call.getString("ssid"),
              let password = call.getString("password") else {
            call.reject("SSID and password are required")
            return
        }
        
        // iOS uses Keychain to store WiFi passwords
        // However, we can't directly save WiFi passwords to system Keychain
        // We'll use UserDefaults as a fallback (less secure but functional)
        
        var savedNetworks = UserDefaults.standard.dictionary(forKey: "saved_wifi_networks") as? [String: String] ?? [:]
        savedNetworks[ssid] = password
        UserDefaults.standard.set(savedNetworks, forKey: "saved_wifi_networks")
        
        call.resolve(["success": true])
    }
    
    // MARK: - Get Password
    
    @objc func getPassword(_ call: CAPPluginCall) {
        guard let ssid = call.getString("ssid") else {
            call.reject("SSID is required")
            return
        }
        
        // Retrieve from UserDefaults
        let savedNetworks = UserDefaults.standard.dictionary(forKey: "saved_wifi_networks") as? [String: String] ?? [:]
        let password = savedNetworks[ssid]
        
        call.resolve([
            "password": password ?? NSNull()
        ])
    }
    
    // MARK: - Delete Password
    
    @objc func deletePassword(_ call: CAPPluginCall) {
        guard let ssid = call.getString("ssid") else {
            call.reject("SSID is required")
            return
        }
        
        var savedNetworks = UserDefaults.standard.dictionary(forKey: "saved_wifi_networks") as? [String: String] ?? [:]
        savedNetworks.removeValue(forKey: ssid)
        UserDefaults.standard.set(savedNetworks, forKey: "saved_wifi_networks")
        
        call.resolve(["success": true])
    }
    
    // MARK: - Get Saved SSIDs
    
    @objc func getSavedSSIDs(_ call: CAPPluginCall) {
        let savedNetworks = UserDefaults.standard.dictionary(forKey: "saved_wifi_networks") as? [String: String] ?? [:]
        let ssids = Array(savedNetworks.keys)
        
        call.resolve(["ssids": ssids])
    }
}

// MARK: - Capacitor Plugin Registration

CAP_PLUGIN(WiFiPlugin, "WiFi",
           CAP_PLUGIN_METHOD(getCurrentSSID, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(scanNetworks, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(checkPermission, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(requestPermission, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(savePassword, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getPassword, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(deletePassword, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getSavedSSIDs, CAPPluginReturnPromise);
)
