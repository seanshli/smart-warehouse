#!/bin/bash

# Setup script for external access to Smart Warehouse app
echo "🌐 Setting up external access for Smart Warehouse..."

# Get local IP address
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
echo "📍 Local IP: $LOCAL_IP"

# Get public IP address
PUBLIC_IP=$(curl -s ipinfo.io/ip)
echo "🌍 Public IP: $PUBLIC_IP"

# Update Capacitor config with current IP
echo "📱 Updating Capacitor configuration..."
sed -i.bak "s/http:\/\/[0-9.]*:3000/http:\/\/$LOCAL_IP:3000/g" capacitor.config.ts

# Update environment file
echo "⚙️ Updating environment configuration..."
if [ -f .env.local ]; then
    sed -i.bak "s/NEXTAUTH_URL=http:\/\/[0-9.]*:3001/NEXTAUTH_URL=http:\/\/$LOCAL_IP:3001/g" .env.local
    echo "✅ Updated .env.local with local IP"
fi

echo ""
echo "🚀 External Access Setup Complete!"
echo "=================================="
echo "📱 Local Network Access: http://$LOCAL_IP:3000"
echo "🌍 Public Access: http://$PUBLIC_IP:3000 (if router configured)"
echo ""
echo "📋 Next Steps:"
echo "1. Make sure your router allows port 3000 access"
echo "2. Update your iPhone app to use: http://$LOCAL_IP:3000"
echo "3. For public access, configure port forwarding on your router"
echo ""
echo "🔧 To start the server with external access:"
echo "   npm run dev -- --hostname 0.0.0.0"
echo ""
echo "⚠️  Security Note:"
echo "   External access is enabled for development only."
echo "   Use HTTPS and proper authentication for production."
