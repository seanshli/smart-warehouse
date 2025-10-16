# 📱 Smart Warehouse Mobile App Distribution Guide

This guide will help you prepare and distribute your Smart Warehouse app for both iOS and Android platforms.

## 🚀 Quick Start

### 1. Prepare Both Platforms
```bash
# Run the automated preparation script
./scripts/prepare-mobile-apps.sh
```

### 2. Manual Steps (if needed)
```bash
# Install Android platform (if not already done)
npm install @capacitor/android
npx cap add android

# Build and sync
NODE_ENV=production npm run build
npx cap copy
npx cap sync
```

## 🍎 iOS Distribution (TestFlight & App Store)

### Prerequisites
- **Xcode** (latest version)
- **Apple Developer Account** ($99/year)
- **Mac computer** (required for iOS development)

### Step-by-Step Process

#### 1. Open iOS Project
```bash
npm run ios:production
```
This will:
- Build the Next.js app for production
- Copy assets to iOS
- Open Xcode

#### 2. Configure in Xcode
1. **Select your development team**:
   - In Xcode, select the project → Signing & Capabilities
   - Choose your Apple Developer Team
   - Ensure "Automatically manage signing" is checked

2. **Update Bundle Identifier** (if needed):
   - Current: `com.smartwarehouse.app`
   - Change if you want a different identifier

3. **Configure App Icons**:
   - Replace icons in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Ensure all required sizes are provided

#### 3. Build for Distribution

**For TestFlight (Beta Testing):**
1. In Xcode: Product → Archive
2. Wait for archive to complete
3. In Organizer window: "Distribute App"
4. Choose "App Store Connect"
5. Choose "Upload"
6. Follow the upload process

**For App Store:**
1. Same as TestFlight, but after upload:
2. Go to [App Store Connect](https://appstoreconnect.apple.com)
3. Complete app information, screenshots, descriptions
4. Submit for review

#### 4. TestFlight Setup
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app → TestFlight
3. Add beta testers
4. Send invites
5. Testers can install via TestFlight app

## 🤖 Android Distribution (Google Play Store)

### Prerequisites
- **Android Studio** (latest version)
- **Google Play Developer Account** ($25 one-time fee)
- **Java Development Kit (JDK)**

### Step-by-Step Process

#### 1. Open Android Project
```bash
npx cap open android
```
This will open Android Studio with your project.

#### 2. Configure in Android Studio

1. **Update App Icons**:
   - Replace icons in `android/app/src/main/res/`
   - Multiple density folders (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)

2. **Configure Signing**:
   - Build → Generate Signed Bundle/APK
   - Create a new keystore (save it securely!)
   - This keystore is required for all future updates

3. **Update Package Name** (if needed):
   - Current: `com.smartwarehouse.app`
   - Change in `android/app/build.gradle`

#### 3. Build for Distribution

**Generate Signed Bundle:**
1. Build → Generate Signed Bundle/APK
2. Choose "Android App Bundle" (.aab)
3. Select your keystore
4. Choose "release" build variant
5. Click "Create"

**Upload to Play Console:**
1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app or select existing
3. Upload the .aab file
4. Complete store listing (description, screenshots, etc.)
5. Submit for review

## 🔧 Configuration Files

### Capacitor Configuration (`capacitor.config.ts`)
```typescript
{
  appId: 'com.smartwarehouse.app',
  appName: 'Smart Warehouse',
  webDir: 'out',
  server: {
    url: 'https://smart-warehouse-five.vercel.app', // Production
    cleartext: false // HTTPS required for production
  }
}
```

### Environment Variables for Production
Make sure these are set in Vercel:
```
DATABASE_URL=postgresql://postgres:Smtengo1324@db.ddvjegjzxjaetpaptjlo.supabase.co:5432/postgres
NEXTAUTH_URL=https://smart-warehouse-five.vercel.app
NEXTAUTH_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
NEXT_PUBLIC_SUPABASE_URL=https://ddvjegjzxjaetpaptjlo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
```

## 📋 Pre-Distribution Checklist

### ✅ Technical Requirements
- [ ] App builds successfully for both platforms
- [ ] All environment variables set in Vercel
- [ ] App icons and splash screens configured
- [ ] App permissions properly configured
- [ ] Privacy policy and terms of service ready

### ✅ iOS Specific
- [ ] Apple Developer Account active
- [ ] App signed with valid certificate
- [ ] Bundle identifier unique
- [ ] TestFlight testing completed
- [ ] App Store Connect metadata ready

### ✅ Android Specific
- [ ] Google Play Developer Account active
- [ ] App signed with release keystore
- [ ] Package name unique
- [ ] Target SDK version updated
- [ ] Play Console metadata ready

### ✅ Testing
- [ ] App works on multiple devices
- [ ] All features tested
- [ ] Performance acceptable
- [ ] No crashes or major bugs
- [ ] Offline functionality (if applicable)

## 🚨 Important Notes

### Security
- **Never commit** your Android keystore to git
- **Backup** your keystore securely
- **Use HTTPS** for all production endpoints
- **Validate** all user inputs

### Updates
- **iOS**: Updates go through App Store review
- **Android**: Updates can be automatic (if configured)
- **Web**: Updates are instant (Vercel deployment)

### Troubleshooting

**Common iOS Issues:**
- Signing errors: Check Apple Developer account
- Build failures: Clean build folder in Xcode
- Archive issues: Ensure correct scheme selected

**Common Android Issues:**
- Gradle sync errors: Update Android Studio
- Build failures: Clean project in Android Studio
- Signing errors: Check keystore configuration

## 📞 Support

If you encounter issues:
1. Check the [Capacitor documentation](https://capacitorjs.com/docs)
2. Review platform-specific guides:
   - [iOS Distribution](https://capacitorjs.com/docs/ios)
   - [Android Distribution](https://capacitorjs.com/docs/android)
3. Check your Vercel deployment logs
4. Verify environment variables are set correctly

## 🎉 Success!

Once both apps are live:
- **iOS**: Available via App Store and TestFlight
- **Android**: Available via Google Play Store
- **Web**: Available at https://smart-warehouse-five.vercel.app

Your Smart Warehouse app will be accessible on all platforms! 🚀
