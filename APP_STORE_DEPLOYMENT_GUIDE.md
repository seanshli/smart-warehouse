# 🚀 App Store Deployment Guide

## 📱 **iOS App Store Deployment**

### **Prerequisites**
- Apple Developer Account ($99/year)
- Xcode installed on macOS
- Valid iOS Distribution Certificate
- App Store Connect access

### **Step 1: Build iOS App**
```bash
# Run the production build script
./scripts/build-ios-production.sh
```

### **Step 2: Upload to App Store Connect**
1. Open Xcode
2. Go to **Window > Organizer**
3. Select your archive (`App.xcarchive`)
4. Click **"Distribute App"**
5. Choose **"App Store Connect"**
6. Follow the upload wizard

### **Step 3: Configure App Store Connect**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app or select existing
3. Fill in app information:
   - **App Name**: Smart Warehouse
   - **Bundle ID**: com.smartwarehouse.app
   - **SKU**: smart-warehouse-ios
   - **Primary Language**: English

### **Step 4: App Store Listing**
- **App Name**: Smart Warehouse
- **Subtitle**: AI-Powered Inventory Management
- **Description**: 
```
Smart Warehouse is an AI-powered inventory management system that helps you organize, track, and manage your items with advanced features like barcode scanning, AI recognition, and multi-language support.

Key Features:
• AI-powered item recognition
• Barcode and QR code scanning
• Multi-language support (English, Chinese, Japanese)
• Smart categorization
• Duplicate detection and cleanup
• Cross-platform sync (Web, iOS, Android)
• Household management
• Advanced search with ChatGPT integration
```

### **Step 5: Screenshots & Metadata**
- Upload screenshots for iPhone (6.7", 6.5", 5.5")
- Upload app icon (1024x1024)
- Set age rating
- Add keywords: inventory, management, barcode, AI, warehouse

---

## 🤖 **Google Play Store Deployment**

### **Prerequisites**
- Google Play Console account ($25 one-time fee)
- Android Studio (optional, for testing)
- Java JDK installed

### **Step 1: Build Android App**
```bash
# Run the production build script
./scripts/build-android-production.sh
```

### **Step 2: Create App Bundle (Recommended)**
```bash
cd android
./gradlew bundleRelease
```
This creates `app/build/outputs/bundle/release/app-release.aab`

### **Step 3: Upload to Google Play Console**
1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app or select existing
3. Go to **Production > Releases**
4. Upload the AAB file (preferred) or APK
5. Fill in release details

### **Step 4: App Store Listing**
- **App Name**: Smart Warehouse
- **Short Description**: AI-Powered Inventory Management
- **Full Description**:
```
Smart Warehouse is an AI-powered inventory management system that helps you organize, track, and manage your items with advanced features like barcode scanning, AI recognition, and multi-language support.

Key Features:
• AI-powered item recognition
• Barcode and QR code scanning
• Multi-language support (English, Chinese, Japanese)
• Smart categorization
• Duplicate detection and cleanup
• Cross-platform sync (Web, iOS, Android)
• Household management
• Advanced search with ChatGPT integration
```

### **Step 5: Store Listing Assets**
- Upload app icon (512x512)
- Upload feature graphic (1024x500)
- Upload screenshots for phone and tablet
- Set content rating
- Add keywords: inventory, management, barcode, AI, warehouse

---

## 🔧 **Production Configuration**

### **Environment Variables**
Both apps are configured to use the production Vercel deployment:
- **Server URL**: `https://smart-warehouse-five.vercel.app`
- **HTTPS Required**: ✅ Enabled
- **Security**: ✅ Configured for production

### **App Configuration**
- **Bundle ID**: `com.smartwarehouse.app`
- **Version**: `1.0.0`
- **Build Number**: `1`
- **Minimum iOS**: 14.0
- **Minimum Android**: API 21 (Android 5.0)

### **Permissions**
- **Camera**: For barcode scanning
- **Photos**: For image uploads
- **Network**: For API calls
- **Storage**: For offline data

---

## 📋 **Pre-Launch Checklist**

### **iOS App Store**
- [ ] App builds successfully
- [ ] Archive created and uploaded
- [ ] App Store Connect configured
- [ ] Screenshots uploaded
- [ ] App review information completed
- [ ] Age rating set
- [ ] Privacy policy URL added
- [ ] App submitted for review

### **Google Play Store**
- [ ] App builds successfully
- [ ] AAB/APK uploaded
- [ ] Store listing completed
- [ ] Screenshots uploaded
- [ ] Content rating completed
- [ ] Privacy policy URL added
- [ ] App submitted for review

### **General**
- [ ] Privacy policy created and hosted
- [ ] Terms of service created
- [ ] App icons created (all sizes)
- [ ] Screenshots taken on real devices
- [ ] App tested on multiple devices
- [ ] All features working in production

---

## 🚨 **Important Notes**

### **App Store Review Guidelines**
- Ensure all features work without crashes
- Test on multiple device sizes
- Verify all permissions are necessary
- Check for any placeholder content
- Ensure proper error handling

### **Google Play Review Guidelines**
- Follow Material Design principles
- Ensure app doesn't crash on launch
- Verify all declared permissions are used
- Test on different Android versions
- Ensure proper content rating

### **Production Monitoring**
- Monitor crash reports
- Track user feedback
- Monitor app performance
- Update app regularly
- Respond to user reviews

---

## 📞 **Support & Maintenance**

### **Post-Launch**
1. Monitor app store reviews
2. Respond to user feedback
3. Fix critical bugs quickly
4. Plan feature updates
5. Monitor analytics

### **Updates**
- Use semantic versioning (1.0.0 → 1.0.1)
- Test thoroughly before release
- Update store listings if needed
- Communicate changes to users

**Ready for deployment! 🎉**
