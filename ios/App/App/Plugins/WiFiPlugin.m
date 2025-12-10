//
//  WiFiPlugin.m
//  App
//
//  Objective-C registration file for WiFiPlugin Swift plugin
//

#import <Capacitor/Capacitor.h>

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
