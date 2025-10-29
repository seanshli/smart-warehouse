import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartwarehouse.app',
  appName: 'Smart Warehouse',
  webDir: 'out',
  // Configure server based on environment
  server: {
    // Production: Point to Vercel deployment
    url: process.env.CAP_SERVER_URL || 'https://smart-warehouse-five.vercel.app',
    cleartext: false // HTTPS required for production
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    allowsLinkPreview: true,
    preferredContentMode: 'mobile'
  },
  android: {
    // Configure for external hosting
    overrideUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    // Tablet and phone support
    appendUserAgent: 'SmartWarehouse/1.0.1',
    // Enable responsive design
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Filesystem: {
      iosIsDocumentPickerEnabled: true,
      androidIsDocumentPickerEnabled: true
    },
    Geolocation: {
      permissions: ['location']
    },
    GoogleMaps: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAHSc802preQitVIaas3o0k8RbLxteSlQQ'
    }
  }
};

export default config;
