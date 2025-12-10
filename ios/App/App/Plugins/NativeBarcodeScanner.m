//
//  NativeBarcodeScanner.m
//  App
//
//  Objective-C registration file for NativeBarcodeScanner Swift plugin
//

#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeBarcodeScanner, "NativeBarcodeScanner",
           CAP_PLUGIN_METHOD(checkPermission, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(requestPermission, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(startScan, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stopScan, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(hideBackground, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(showBackground, CAPPluginReturnPromise);
)
