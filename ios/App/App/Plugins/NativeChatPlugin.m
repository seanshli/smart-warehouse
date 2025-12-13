//
//  NativeChatPlugin.m
//  App
//
//  Objective-C registration file for NativeChatPlugin Swift plugin
//

#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeChatPlugin, "NativeChat",
           CAP_PLUGIN_METHOD(showChat, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(sendMessage, CAPPluginReturnPromise);
)
