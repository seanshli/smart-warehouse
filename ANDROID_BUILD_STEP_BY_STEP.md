# Android Build - Step by Step Guide

**Version**: 1.0.72  
**Build Number**: 74  
**Date**: 2025-01-06

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ **Android Studio** (latest version) - [Download](https://developer.android.com/studio)
- ✅ **Java JDK 17+** (check: `java -version`)
- ✅ **Android SDK** (installed via Android Studio)
- ✅ **Gradle** (comes with Android Studio)
- ✅ **Node.js & npm** (for Capacitor sync)

---

## 🚀 Step-by-Step Build Process

### **Step 1: Verify Current Version**

```bash
# Navigate to project root
cd /Users/seanli/smart-warehouse

# Check version numbers
grep "versionCode\|versionName" android/app/build.gradle
```

**Expected Output:**
```
versionCode 74
versionName "1.0.72"
```

---

### **Step 2: Build Web App (Production)**

```bash
# Build Next.js app for production
npm run build:production
```

**What this does:**
- Builds optimized Next.js app
- Generates static assets
- Prepares for mobile deployment

**Expected Output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

---

### **Step 3: Sync Capacitor**

```bash
# Copy web build to native projects
npx cap copy
```

**What this does:**
- Copies web build to `android/app/src/main/assets/public`
- Ensures native apps have latest web code

---

### **Step 4: Sync Android Project**

```bash
# Sync Android-specific configurations
npx cap sync android
```

**What this does:**
- Updates Android dependencies
- Syncs plugin configurations
- Ensures native plugins are registered

**Expected Output:**
```
✔ Copying web assets from out to android/app/src/main/assets/public
✔ Copying native bridge
✔ Copying capacitor.config.json
✔ Syncing Android project
```

---

### **Step 5: Open Android Studio**

```bash
# Open Android Studio with the project
npx cap open android
```

**What happens:**
- Android Studio launches automatically
- Project opens in Android Studio
- Gradle sync starts automatically

**Wait for:**
- ✅ "Gradle sync finished" message
- ✅ No red error indicators
- ✅ Project structure visible in left panel

---

### **Step 6: Wait for Gradle Sync**

**In Android Studio:**

1. **Check bottom status bar:**
   - Look for "Gradle sync finished" or progress indicator
   - If errors appear, check "Build" tab at bottom

2. **Common issues:**
   - **"SDK not found"**: Go to `File → Project Structure → SDK Location`
   - **"Gradle sync failed"**: Check internet connection, try `File → Sync Project with Gradle Files`
   - **"Java version mismatch"**: Ensure Java 17+ is installed

3. **Verify sync success:**
   - No red error markers in project tree
   - "Build" tab shows "BUILD SUCCESSFUL"

---

### **Step 7: Build Options**

You have two main options:

#### **Option A: Build APK (For Testing/Direct Install)** ⭐ Recommended for Testing

**Steps:**

1. **Open Build Menu:**
   - Click `Build` in top menu bar
   - Select `Build Bundle(s) / APK(s)`
   - Click `Build APK(s)`

2. **Wait for Build:**
   - Progress shown in bottom "Build" tab
   - Usually takes 2-5 minutes

3. **Locate APK:**
   - When complete, click "locate" in notification
   - Or navigate to:
     ```
     android/app/build/outputs/apk/release/app-release-unsigned.apk
     ```

4. **Sign APK (Required for installation):**
   - See "Signing APK" section below

---

#### **Option B: Build Signed Bundle (For Play Store)** ⭐ Recommended for Release

**Steps:**

1. **Open Build Menu:**
   - Click `Build` in top menu bar
   - Select `Generate Signed Bundle / APK`

2. **Choose Bundle Type:**
   - Select `Android App Bundle (.aab)` ⭐
   - Click `Next`

3. **Select Signing Key:**

   **If you have existing key:**
   - Click `Choose existing...`
   - Navigate to key file (e.g., `smart-warehouse-release-key.jks`)
   - Enter:
     - Key store password
     - Key alias
     - Key password

   **If creating new key:**
   - Click `Create new...`
   - Fill in:
     ```
     Key store path: [Choose location]/smart-warehouse-release-key.jks
     Password: [Your secure password]
     Key alias: smart-warehouse
     Key password: [Your secure password]
     Validity: 10000 years
     Certificate:
       First and Last Name: Smart Warehouse
       Organizational Unit: Development
       Organization: Smart Warehouse
       City: [Your city]
       State: [Your state]
       Country: [Your country code, e.g., US]
     ```
   - ⚠️ **IMPORTANT**: Save key information securely! You'll need it for all future updates.

4. **Select Build Type:**
   - Choose `release`
   - Click `Finish`

5. **Wait for Build:**
   - Progress shown in "Build" tab
   - Usually takes 3-7 minutes

6. **Locate AAB:**
   - When complete, click "locate" in notification
   - Or navigate to:
     ```
     android/app/build/outputs/bundle/release/app-release.aab
     ```

---

### **Step 8: Sign APK (If Building APK)**

If you built an unsigned APK, you need to sign it:

**Method 1: Using Android Studio**

1. Go to `Build → Generate Signed Bundle / APK`
2. Select `APK`
3. Choose your signing key (same as above)
4. Select `release`
5. Click `Finish`

**Method 2: Using Command Line**

```bash
# Navigate to Android directory
cd android

# Sign the APK (replace paths and passwords)
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore /path/to/smart-warehouse-release-key.jks \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  smart-warehouse

# Align the APK
zipalign -v 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  app/build/outputs/apk/release/app-release-signed.apk
```

---

### **Step 9: Verify Build**

**Check build output:**

```bash
# For APK
ls -lh android/app/build/outputs/apk/release/
# Should see: app-release-signed.apk (or app-release.apk)

# For AAB
ls -lh android/app/build/outputs/bundle/release/
# Should see: app-release.aab
```

**Verify version:**

```bash
# Check APK version
aapt dump badging android/app/build/outputs/apk/release/app-release.apk | grep versionCode
# Should show: versionCode='74' versionName='1.0.72'
```

---

## 🔧 Alternative: Command Line Build

If you prefer command line:

### **Build Release APK:**

```bash
cd android
./gradlew assembleRelease
```

**Output:**
```
android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### **Build Release AAB:**

```bash
cd android
./gradlew bundleRelease
```

**Output:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

### **Clean Build:**

```bash
cd android
./gradlew clean
```

---

## 📱 Testing the Build

### **Install APK on Device:**

**Method 1: Via USB (ADB)**

```bash
# Check connected devices
adb devices

# Install APK
adb install android/app/build/outputs/apk/release/app-release.apk

# If already installed, use -r to replace
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

**Method 2: Via File Transfer**

1. Copy APK to Android device
2. Open file manager on device
3. Navigate to APK file
4. Tap to install
5. Allow "Install from unknown sources" if prompted

---

## 🚨 Troubleshooting

### **Issue: Gradle Sync Failed**

**Solution:**
```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
```

Then in Android Studio: `File → Sync Project with Gradle Files`

---

### **Issue: "SDK location not found"**

**Solution:**
1. Open `File → Project Structure → SDK Location`
2. Set Android SDK location (usually `~/Library/Android/sdk` on Mac)
3. Click `Apply`

---

### **Issue: "Java version mismatch"**

**Solution:**
```bash
# Check Java version
java -version
# Should be 17 or higher

# Set JAVA_HOME if needed
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

---

### **Issue: "Build failed: OutOfMemoryError"**

**Solution:**

Edit `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m
```

---

### **Issue: "Plugin with id 'com.android.application' not found"**

**Solution:**
```bash
cd android
./gradlew wrapper --gradle-version=8.3
```

---

## 📤 Upload to Google Play Store

### **Using AAB File:**

1. **Login to Play Console:**
   - Go to https://play.google.com/console
   - Select "Smart Warehouse" app

2. **Create New Release:**
   - Go to `Production` or `Internal testing`
   - Click `Create new release`

3. **Upload AAB:**
   - Upload `app-release.aab` file
   - Fill in release notes:
     ```
     Version: 1.0.72 (Build 74)
     
     What's new:
     - Enhanced native modules (Keyboard, StatusBar, SplashScreen)
     - Improved warehouse functions accessibility
     - Bug fixes and performance improvements
     ```

4. **Review and Submit:**
   - Review all information
   - Click `Save` then `Review release`
   - Submit for review

---

## ✅ Build Checklist

Before building, verify:

- [ ] Version number updated: `1.0.72`
- [ ] Build number incremented: `74`
- [ ] Web app built: `npm run build:production`
- [ ] Capacitor synced: `npx cap sync android`
- [ ] Android Studio opened: `npx cap open android`
- [ ] Gradle sync completed successfully
- [ ] Signing key ready (for release builds)
- [ ] All tests passed (if applicable)

---

## 📊 Build Summary

**Current Configuration:**
- **Version**: 1.0.72
- **Build Number**: 74
- **Package ID**: com.smartwarehouse.app
- **Min SDK**: Check `android/variables.gradle`
- **Target SDK**: Check `android/variables.gradle`
- **Java Version**: 17

**Output Files:**
- **APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🎯 Quick Reference

**Full Build Command Sequence:**

```bash
# 1. Build web app
npm run build:production

# 2. Sync Capacitor
npx cap sync android

# 3. Open Android Studio
npx cap open android

# Then in Android Studio:
# Build → Generate Signed Bundle / APK → Android App Bundle → Next → Select key → Finish
```

**Command Line Alternative:**

```bash
cd android
./gradlew bundleRelease
# Output: app/build/outputs/bundle/release/app-release.aab
```

---

**Status**: ✅ Ready to build!  
**Last Updated**: 2025-01-06
