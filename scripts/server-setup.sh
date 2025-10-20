#!/bin/bash

# Smart Warehouse Server Setup Script
# Run this on your Ubuntu 20.04/22.04 server

set -e

echo "🚀 Setting up Smart Warehouse on your server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
print_status "Installing PostgreSQL..."
sudo apt-get install postgresql postgresql-contrib -y

# Install Nginx
print_status "Installing Nginx..."
sudo apt-get install nginx -y

# Install PM2 globally
print_status "Installing PM2 process manager..."
sudo npm install -g pm2

# Install additional tools
print_status "Installing additional tools..."
sudo apt-get install -y git curl wget unzip

# Create application user
print_status "Creating application user..."
sudo adduser --system --group --home /var/www/smartwarehouse smartwarehouse || true

# Setup PostgreSQL
print_status "Setting up PostgreSQL database..."
sudo -u postgres createuser smartwarehouse || true
sudo -u postgres createdb smartwarehouse || true

# Generate random password for database
DB_PASSWORD=$(openssl rand -base64 32)
print_status "Generated database password: $DB_PASSWORD"
echo "DATABASE_PASSWORD=$DB_PASSWORD" > /tmp/db_password.txt

# Set database password
sudo -u postgres psql -c "ALTER USER smartwarehouse PASSWORD '$DB_PASSWORD';"

# Create application directory
print_status "Setting up application directory..."
sudo mkdir -p /var/www/smartwarehouse
sudo chown smartwarehouse:smartwarehouse /var/www/smartwarehouse

# Clone repository
print_status "Cloning Smart Warehouse repository..."
cd /var/www/smartwarehouse
sudo -u smartwarehouse git clone https://github.com/seanshli/smart-warehouse.git .

# Install dependencies
print_status "Installing Node.js dependencies..."
sudo -u smartwarehouse npm install

# Create environment file
print_status "Creating environment configuration..."
sudo -u smartwarehouse tee .env << EOF
# Database
DATABASE_URL="postgresql://smartwarehouse:$DB_PASSWORD@localhost:5432/smartwarehouse"

# NextAuth
NEXTAUTH_URL="http://$(curl -s ifconfig.me)"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"

# OpenAI
OPENAI_API_KEY="your-openai-api-key-here"

# App Configuration
NODE_ENV="production"
PORT=3000

# Authentication (enabled)
REQUIRE_AUTH="true"
ADMIN_EMAIL="admin@smartwarehouse.com"
EOF

# Build the application
print_status "Building Smart Warehouse application..."
sudo -u smartwarehouse npm run build

# Run database migrations
print_status "Running database migrations..."
sudo -u smartwarehouse npx prisma migrate deploy

# Setup authentication
print_status "Setting up authentication system..."
sudo -u smartwarehouse node scripts/setup-authentication.sh

# Create admin user
print_status "Creating admin user..."
sudo -u smartwarehouse node scripts/create-admin-user.js

# Create PM2 ecosystem file
print_status "Creating PM2 configuration..."
sudo -u smartwarehouse tee ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'smartwarehouse',
    script: 'node',
    args: '.next/standalone/server.js',
    cwd: '/var/www/smartwarehouse',
    user: 'smartwarehouse',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
EOF

# Start application with PM2
print_status "Starting Smart Warehouse with PM2..."
sudo -u smartwarehouse pm2 start ecosystem.config.js
sudo -u smartwarehouse pm2 save

# Setup PM2 to start on boot
print_status "Setting up PM2 to start on boot..."
sudo -u smartwarehouse pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u smartwarehouse --hp /var/www/smartwarehouse

# Configure Nginx
print_status "Configuring Nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/smartwarehouse << EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/smartwarehouse /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

# Install SSL certificate (optional)
print_status "Setting up SSL certificate..."
sudo apt-get install certbot python3-certbot-nginx -y

# Create deployment script
print_status "Creating deployment script..."
sudo -u smartwarehouse tee deploy.sh << 'EOF'
#!/bin/bash
cd /var/www/smartwarehouse
git pull origin main
npm install
npm run build
npx prisma migrate deploy
pm2 restart smartwarehouse
echo "Deployment completed!"
EOF

sudo chmod +x /var/www/smartwarehouse/deploy.sh

# Create backup script
print_status "Creating backup script..."
sudo -u smartwarehouse tee backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/smartwarehouse"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
pg_dump smartwarehouse > $BACKUP_DIR/database_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/smartwarehouse --exclude=node_modules --exclude=.next

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

sudo chmod +x /var/www/smartwarehouse/backup.sh

# Setup cron job for backups
print_status "Setting up automated backups..."
echo "0 2 * * * /var/www/smartwarehouse/backup.sh" | sudo -u smartwarehouse crontab -

# Create monitoring script
print_status "Creating monitoring script..."
sudo -u smartwarehouse tee monitor.sh << 'EOF'
#!/bin/bash
# Check if app is running
if ! pm2 list | grep -q "smartwarehouse.*online"; then
    echo "Smart Warehouse is down! Restarting..."
    pm2 restart smartwarehouse
    # Send notification (customize as needed)
    echo "Smart Warehouse was restarted at $(date)" | mail -s "Smart Warehouse Alert" admin@yourcompany.com
fi
EOF

sudo chmod +x /var/www/smartwarehouse/monitor.sh

# Setup monitoring cron job
echo "*/5 * * * * /var/www/smartwarehouse/monitor.sh" | sudo -u smartwarehouse crontab -

# Final status
print_status "Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Update your domain DNS to point to this server: $(curl -s ifconfig.me)"
echo "2. Edit /var/www/smartwarehouse/.env and add your OpenAI API key"
echo "3. Run SSL setup: sudo certbot --nginx -d your-domain.com"
echo "4. Test your application at: http://$(curl -s ifconfig.me)"
echo ""
echo "🔧 Management Commands:"
echo "- View logs: sudo -u smartwarehouse pm2 logs smartwarehouse"
echo "- Restart app: sudo -u smartwarehouse pm2 restart smartwarehouse"
echo "- Deploy updates: sudo -u smartwarehouse /var/www/smartwarehouse/deploy.sh"
echo "- Manual backup: sudo -u smartwarehouse /var/www/smartwarehouse/backup.sh"
echo ""
echo "📊 Database Info:"
echo "- Database: smartwarehouse"
echo "- User: smartwarehouse"
echo "- Password: $DB_PASSWORD (saved in /tmp/db_password.txt)"
echo ""
print_warning "Don't forget to:"
echo "1. Update your OpenAI API key in .env"
echo "2. Set up SSL certificate with certbot"
echo "3. Configure your domain DNS"
echo "4. Test the application thoroughly"

print_status "Smart Warehouse is now running on your server! 🎉"
