# Supabase Database Setup Guide

## 🚨 **IMPORTANT: Database Schema Missing**

The error you're seeing (`relation "User" does not exist`) means the database tables haven't been created in Supabase yet.

## 🔧 **Quick Fix Steps:**

### **1. Go to Supabase Dashboard**
- Open: https://supabase.com/dashboard
- Select your project: `ddvjegjzxjaetpaptjlo`

### **2. Open SQL Editor**
- Click on "SQL Editor" in the left sidebar
- Click "New Query"

### **3. Run the Database Schema**
Copy and paste the entire contents of `scripts/setup-supabase-schema.sql` into the SQL Editor and click "Run".

This will:
- ✅ Create all required tables (User, Household, Item, etc.)
- ✅ Create admin user: `admin@smartwarehouse.com` / `admin123`
- ✅ Create test user: `user@smartwarehouse.com` / `user123`
- ✅ Set up test data (rooms, cabinets, categories, items)

### **4. Verify Setup**
After running the SQL, you should see:
- ✅ "Database schema created successfully!" message
- ✅ Tables created in the "Table Editor"
- ✅ Users created with proper passwords

## 🔐 **Login Credentials:**

After running the SQL script, you can login with:

**Admin Account:**
- Email: `admin@smartwarehouse.com`
- Password: `admin123`

**Test User Account:**
- Email: `user@smartwarehouse.com`
- Password: `user123`

## 🚀 **Next Steps:**

1. **Run the SQL script** in Supabase
2. **Test the app** at https://smart-warehouse-five.vercel.app
3. **Login with admin credentials**
4. **Change the default passwords** immediately!

## 🔧 **Alternative: Use Prisma Migrate (if connection works):**

If you can get the database connection working locally:

```bash
# Set environment variable
export DATABASE_URL="postgresql://postgres:Smtengo1324@db.ddvjegjzxjaetpaptjlo.supabase.co:5432/postgres"

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

## 📱 **Mobile App Impact:**

After the database is set up:
- ✅ **Mobile apps will require real login**
- ✅ **No more demo user bypass**
- ✅ **Each user sees only their household data**

## 🆘 **If You Need Help:**

1. **Check Supabase connection** in the dashboard
2. **Verify the SQL script** runs without errors
3. **Test login** on the web app first
4. **Then test mobile apps**

The database setup is the missing piece - once this is done, authentication will work perfectly! 🎉

