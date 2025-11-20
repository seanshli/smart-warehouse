package com.smartwarehouse.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.smartwarehouse.app.plugins.TuyaProvisioningPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(TuyaProvisioningPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
