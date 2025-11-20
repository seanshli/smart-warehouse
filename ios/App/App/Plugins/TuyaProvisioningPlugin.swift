import Foundation
import Capacitor

@objc(TuyaProvisioningPlugin)
public class TuyaProvisioningPlugin: CAPPlugin {
    private func pendingImplementationResponse(message: String = "Tuya native SDK integration pending") -> [String: Any] {
        return [
            "success": false,
            "error": message,
            "status": "not_implemented"
        ]
    }

    @objc func initialize(_ call: CAPPluginCall) {
        call.resolve([
            "initialized": false,
            "native": true,
            "message": "Tuya native SDK placeholder initialized. Actual SDK integration pending."
        ])
    }

    @objc func startProvisioning(_ call: CAPPluginCall) {
        call.resolve(pendingImplementationResponse(message: "startProvisioning not yet implemented on native iOS."))
    }

    @objc func getStatus(_ call: CAPPluginCall) {
        call.resolve(pendingImplementationResponse(message: "getStatus not yet implemented on native iOS."))
    }

    @objc func stopProvisioning(_ call: CAPPluginCall) {
        call.resolve([
            "success": true,
            "message": "stopProvisioning placeholder executed."
        ])
    }
}

// swiftlint:disable:next line_length
CAP_PLUGIN(TuyaProvisioningPlugin, "TuyaProvisioning",
           CAP_PLUGIN_METHOD(initialize, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startProvisioning, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(getStatus, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopProvisioning, CAPPluginReturnPromise);
)

