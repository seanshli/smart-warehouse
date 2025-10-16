# 🌐 External Access Guide for Smart Warehouse

This guide helps you configure the Smart Warehouse app for access from external networks (different WiFi networks, mobile data, etc.).

## 🚀 Quick Setup

### 1. Run the Setup Script
```bash
npm run setup:external
```

This script will:
- Detect your local IP address
- Update Capacitor configuration
- Update environment variables
- Provide access URLs

### 2. Start Server with External Access
```bash
npm run dev:external
```

This starts the development server accessible from external networks.

## 📱 Access URLs

After setup, you can access the app from:

- **Local Network**: `http://172.20.10.4:3000`
- **External Network**: `http://111.71.36.67:3000` (requires router configuration)

## 🔧 Manual Configuration

### Router Configuration (For External Access)

1. **Access Router Admin Panel**
   - Usually `192.168.1.1` or `192.168.0.1`
   - Check router manual for correct address

2. **Configure Port Forwarding**
   - External Port: `3000`
   - Internal IP: `172.20.10.4`
   - Internal Port: `3000`
   - Protocol: `TCP`

3. **Enable DMZ (Alternative)**
   - Set your computer IP (`172.20.10.4`) in DMZ
   - ⚠️ Less secure but easier setup

### iPhone App Configuration

1. **Update Capacitor Config**
   ```bash
   npx cap copy
   npx cap open ios
   ```

2. **In Xcode**
   - Update the server URL to your external IP
   - Build and install on device

## 🛡️ Security Considerations

### Development Mode
- ✅ HTTP allowed for testing
- ✅ CORS enabled for all origins
- ⚠️ No authentication required

### Production Mode
- ✅ HTTPS required
- ✅ Proper authentication
- ✅ Restricted CORS
- ✅ Environment variables secured

## 🔍 Troubleshooting

### Cannot Access from External Network

1. **Check Firewall**
   ```bash
   # macOS - Allow incoming connections
   sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
   ```

2. **Check Router Settings**
   - Ensure port 3000 is forwarded
   - Check if ISP blocks ports
   - Try different port if needed

3. **Test Connection**
   ```bash
   # Test if port is accessible
   telnet 111.71.36.67 3000
   ```

### iPhone App Issues

1. **Clear App Data**
   - Delete and reinstall app
   - Clear Safari cache

2. **Check Network Settings**
   - Ensure iPhone can access external IP
   - Test in Safari first

3. **Update Configuration**
   ```bash
   npm run setup:external
   npx cap copy
   npx cap open ios
   ```

## 📋 Environment Variables

Update these for external access:

```bash
# .env.local
NEXTAUTH_URL=http://172.20.10.4:3001
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
CAP_SERVER_URL=http://172.20.10.4:3000
```

## 🌍 Production Deployment

For production external access:

1. **Use Vercel/Netlify** (Recommended)
   - Automatic HTTPS
   - Global CDN
   - Easy domain setup

2. **Self-Hosted with Domain**
   - Get domain name
   - Configure DNS
   - Set up SSL certificate
   - Update CAP_SERVER_URL

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify network connectivity
3. Test with different devices/networks
4. Check server logs for errors

## 🔄 Quick Commands

```bash
# Setup external access
npm run setup:external

# Start with external access
npm run dev:external

# Build for mobile with external access
npm run cap:copy
npx cap open ios

# Check current IP
curl ipinfo.io/ip
```

---

**Note**: External access is primarily for development and testing. For production use, deploy to a proper hosting service with HTTPS and security measures.
