import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartwarehouse.app',
  appName: 'Smart Warehouse',
  webDir: 'out',
  // Configure server based on environment
  server: process.env.NODE_ENV === 'production' ? {
    // Production: Point to external HTTPS domain
    url: process.env.CAP_SERVER_URL || 'https://your-domain.com',
    cleartext: false // HTTPS required for production
  } : {
    // Development: Point to local dev server
    url: process.env.CAP_SERVER_URL || 'http://10.68.1.183:3000',
    cleartext: true // Allow HTTP for development
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    // Allow external access for development
    allowsLinkPreview: true,
    // Configure for external hosting
    preferredContentMode: 'mobile'
  },
  android: {
    // Configure for external hosting
    overrideUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  }
};

export default config;
