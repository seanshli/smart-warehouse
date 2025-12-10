package com.smartwarehouse.app.plugins;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.wifi.ScanResult;
import android.net.wifi.WifiConfiguration;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.util.Log;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "WiFi")
public class WiFiPlugin extends Plugin {

    private static final String TAG = "WiFiPlugin";
    private static final int LOCATION_PERMISSION_REQUEST_CODE = 1001;

    private WifiManager wifiManager;

    @Override
    public void load() {
        super.load();
        wifiManager = (WifiManager) getContext().getApplicationContext().getSystemService(Context.WIFI_SERVICE);
    }

    @PluginMethod
    public void getCurrentSSID(PluginCall call) {
        if (!checkLocationPermission()) {
            call.reject("Location permission is required to get WiFi SSID");
            return;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ requires different approach
                if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    call.reject("Location permission is required");
                    return;
                }
            }

            WifiInfo wifiInfo = wifiManager.getConnectionInfo();
            String ssid = wifiInfo.getSSID();
            
            // Remove quotes if present
            if (ssid != null && ssid.startsWith("\"") && ssid.endsWith("\"")) {
                ssid = ssid.substring(1, ssid.length() - 1);
            }

            JSObject result = new JSObject();
            result.put("ssid", ssid != null && !ssid.equals("<unknown ssid>") ? ssid : null);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error getting current SSID", e);
            call.reject("Failed to get current SSID: " + e.getMessage());
        }
    }

    @PluginMethod
    public void scanNetworks(PluginCall call) {
        if (!checkLocationPermission()) {
            call.reject("Location permission is required to scan WiFi networks");
            return;
        }

        try {
            if (!wifiManager.isWifiEnabled()) {
                call.reject("WiFi is not enabled. Please enable WiFi and try again.");
                return;
            }

            // Start WiFi scan
            boolean scanStarted = wifiManager.startScan();
            if (!scanStarted) {
                call.reject("Failed to start WiFi scan");
                return;
            }

            // Wait a bit for scan to complete
            try {
                Thread.sleep(2000); // Wait 2 seconds for scan to complete
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }

            // Get scan results
            if (ActivityCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                call.reject("Location permission is required");
                return;
            }

            List<ScanResult> scanResults = wifiManager.getScanResults();
            JSONArray networks = new JSONArray();

            // Get currently connected network
            WifiInfo wifiInfo = wifiManager.getConnectionInfo();
            String currentSSID = wifiInfo.getSSID();
            if (currentSSID != null && currentSSID.startsWith("\"")) {
                currentSSID = currentSSID.substring(1, currentSSID.length() - 1);
            }

            for (ScanResult result : scanResults) {
                try {
                    JSONObject network = new JSONObject();
                    network.put("ssid", result.SSID);
                    network.put("bssid", result.BSSID);
                    network.put("signalStrength", result.level); // dBm
                    network.put("frequency", result.frequency);
                    
                    // Determine security type
                    String security = "none";
                    if (result.capabilities != null) {
                        if (result.capabilities.contains("WPA3")) {
                            security = "wpa3";
                        } else if (result.capabilities.contains("WPA2")) {
                            security = "wpa2";
                        } else if (result.capabilities.contains("WPA")) {
                            security = "wpa";
                        } else if (result.capabilities.contains("WEP")) {
                            security = "wep";
                        }
                    }
                    network.put("security", security);
                    
                    // Check if this is the currently connected network
                    boolean isConnected = result.SSID.equals(currentSSID);
                    network.put("isConnected", isConnected);

                    networks.put(network);
                } catch (JSONException e) {
                    Log.e(TAG, "Error creating network JSON", e);
                }
            }

            JSObject result = new JSObject();
            result.put("networks", networks);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error scanning WiFi networks", e);
            call.reject("Failed to scan WiFi networks: " + e.getMessage());
        }
    }

    @PluginMethod
    public void checkPermission(PluginCall call) {
        boolean granted = checkLocationPermission();
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (checkLocationPermission()) {
            JSObject result = new JSObject();
            result.put("granted", true);
            call.resolve(result);
            return;
        }

        // Request permission
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, LOCATION_PERMISSION_REQUEST_CODE);
        }

        // Check again after a delay
        getActivity().runOnUiThread(() -> {
            try {
                Thread.sleep(500);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            boolean granted = checkLocationPermission();
            JSObject result = new JSObject();
            result.put("granted", granted);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void savePassword(PluginCall call) {
        String ssid = call.getString("ssid");
        String password = call.getString("password");

        if (ssid == null || password == null) {
            call.reject("SSID and password are required");
            return;
        }

        try {
            // Save to SharedPreferences (Android's equivalent of UserDefaults)
            android.content.SharedPreferences prefs = getContext().getSharedPreferences("wifi_networks", Context.MODE_PRIVATE);
            android.content.SharedPreferences.Editor editor = prefs.edit();
            editor.putString(ssid, password);
            editor.apply();

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error saving WiFi password", e);
            call.reject("Failed to save WiFi password: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getPassword(PluginCall call) {
        String ssid = call.getString("ssid");

        if (ssid == null) {
            call.reject("SSID is required");
            return;
        }

        try {
            android.content.SharedPreferences prefs = getContext().getSharedPreferences("wifi_networks", Context.MODE_PRIVATE);
            String password = prefs.getString(ssid, null);

            JSObject result = new JSObject();
            result.put("password", password != null ? password : null);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error getting WiFi password", e);
            call.reject("Failed to get WiFi password: " + e.getMessage());
        }
    }

    @PluginMethod
    public void deletePassword(PluginCall call) {
        String ssid = call.getString("ssid");

        if (ssid == null) {
            call.reject("SSID is required");
            return;
        }

        try {
            android.content.SharedPreferences prefs = getContext().getSharedPreferences("wifi_networks", Context.MODE_PRIVATE);
            android.content.SharedPreferences.Editor editor = prefs.edit();
            editor.remove(ssid);
            editor.apply();

            JSObject result = new JSObject();
            result.put("success", true);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error deleting WiFi password", e);
            call.reject("Failed to delete WiFi password: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getSavedSSIDs(PluginCall call) {
        try {
            android.content.SharedPreferences prefs = getContext().getSharedPreferences("wifi_networks", Context.MODE_PRIVATE);
            java.util.Map<String, ?> allNetworks = prefs.getAll();
            JSONArray ssids = new JSONArray();

            for (String ssid : allNetworks.keySet()) {
                ssids.put(ssid);
            }

            JSObject result = new JSObject();
            result.put("ssids", ssids);
            call.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error getting saved SSIDs", e);
            call.reject("Failed to get saved SSIDs: " + e.getMessage());
        }
    }

    private boolean checkLocationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        }
        return true; // Permission granted by default on older Android versions
    }
}
