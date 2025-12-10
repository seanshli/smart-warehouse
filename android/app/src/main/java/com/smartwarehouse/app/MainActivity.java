package com.smartwarehouse.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.smartwarehouse.app.plugins.TuyaProvisioningPlugin;
import com.smartwarehouse.app.plugins.MideaProvisioningPlugin;
import com.smartwarehouse.app.plugins.NativeBarcodeScannerPlugin;
import com.smartwarehouse.app.plugins.WiFiPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(TuyaProvisioningPlugin.class);
        registerPlugin(MideaProvisioningPlugin.class);
        registerPlugin(NativeBarcodeScannerPlugin.class);
        registerPlugin(WiFiPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
