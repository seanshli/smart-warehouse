import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartwarehouse.app',
  appName: 'Smart Warehouse',
  webDir: 'out',
  // Configure server based on environment
  server: process.env.NODE_ENV === 'production' ? {
    // Production: Point to Vercel deployment
    url: process.env.CAP_SERVER_URL || 'https://smart-warehouse-five.vercel.app',
    cleartext: false // HTTPS required for production
  } : {
    // Development: Point to local dev server with external access
    url: process.env.CAP_SERVER_URL || 'http://192.168.68.112:3000',
    cleartext: true // Allow HTTP for development
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    allowsLinkPreview: true,
    preferredContentMode: 'mobile'
  },
  android: {
    // Configure for external hosting
    overrideUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Filesystem: {
      iosIsDocumentPickerEnabled: true,
      androidIsDocumentPickerEnabled: true
    }
  }
};

export default config;
