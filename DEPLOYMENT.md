# 🚀 Deployment Guide for External Access

## Overview
This guide explains how to deploy your Smart Warehouse app to an external server and configure it for production use.

## ✅ Configuration Completed

### 1. CORS Configuration
- ✅ Next.js CORS headers configured in `next.config.js`
- ✅ Middleware CORS handling added in `middleware.ts`
- ✅ API routes now accept external requests

### 2. Capacitor Configuration
- ✅ Environment-based server URLs in `capacitor.config.ts`
- ✅ Production HTTPS configuration
- ✅ iOS and Android external access settings

### 3. Build Scripts
- ✅ Production build script: `npm run build:production`
- ✅ Production iOS build: `npm run ios:production`

## 🌐 Deployment Options

### Option A: Vercel (Recommended - Easiest)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - `DATABASE_URL` - Your production database URL
   - `NEXTAUTH_URL` - Your Vercel domain (e.g., `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET` - A secure random string
   - `CAP_SERVER_URL` - Your Vercel domain

4. **Update Capacitor Config:**
   ```bash
   # Set your Vercel domain
   export CAP_SERVER_URL="https://your-app.vercel.app"
   npm run ios:production
   ```

### Option B: Railway

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Deploy:**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Set Environment Variables:**
   - Same as Vercel above
   - Use your Railway domain

### Option C: DigitalOcean App Platform

1. **Connect GitHub repository**
2. **Configure build settings:**
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - Output Directory: `.next`

3. **Set Environment Variables:**
   - Same as above

## 🔧 Production Configuration

### Environment Variables Required:
```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth.js
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"

# Capacitor
CAP_SERVER_URL="https://your-domain.com"

# Optional: OpenAI API
OPENAI_API_KEY="your-openai-api-key"
```

### Database Setup:

#### Option 1: Supabase (Recommended)
1. Create Supabase project
2. Get database URL from project settings
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

#### Option 2: PostgreSQL
1. Create PostgreSQL database
2. Update `DATABASE_URL`
3. Run migrations as above

## 📱 iOS App Configuration

### For Development (Current):
```typescript
// capacitor.config.ts
server: {
  url: 'http://10.68.1.183:3000',
  cleartext: true
}
```

### For Production:
```typescript
// capacitor.config.ts
server: {
  url: 'https://your-domain.com',
  cleartext: false
}
```

### Build Commands:
```bash
# Development build
npm run ios

# Production build
npm run ios:production
```

## 🧪 Testing External Access

### Test Script:
```bash
node scripts/test-external-access.js
```

### Manual Testing:
1. Deploy to hosting service
2. Test API endpoints:
   ```bash
   curl -I https://your-domain.com/api/auth/session
   ```
3. Verify CORS headers are present

### iOS Testing:
1. Build production version: `npm run ios:production`
2. Install on device via Xcode
3. Test all functionality

## 🔒 Security Considerations

### Required for App Store:
- ✅ HTTPS only (no HTTP)
- ✅ CORS properly configured
- ✅ Secure authentication
- ✅ Input validation

### Additional Security:
- Rate limiting (consider adding)
- Environment variable protection
- Database connection security
- API endpoint authentication

## 📋 Deployment Checklist

- [ ] Choose hosting service (Vercel/Railway/DigitalOcean)
- [ ] Deploy backend application
- [ ] Configure domain and SSL certificate
- [ ] Set up production database
- [ ] Configure environment variables
- [ ] Test API endpoints
- [ ] Update Capacitor configuration
- [ ] Build production iOS app
- [ ] Test on physical device
- [ ] Submit to TestFlight

## 🚨 Common Issues

### CORS Errors:
- Ensure `middleware.ts` is properly configured
- Check `next.config.js` headers
- Verify API routes return proper headers

### Capacitor Connection Issues:
- Ensure HTTPS URL in production
- Check network connectivity
- Verify domain is accessible

### Database Connection:
- Verify `DATABASE_URL` format
- Check database accessibility
- Run migrations if needed

## 📞 Support

If you encounter issues:
1. Check server logs
2. Verify environment variables
3. Test API endpoints manually
4. Check Capacitor configuration

## 🎯 Next Steps

1. **Deploy to hosting service**
2. **Update Capacitor config with production URL**
3. **Build and test iOS app**
4. **Submit to TestFlight**
5. **Invite beta testers**

---

**Your app is now configured for external access! 🎉**
