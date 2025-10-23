-- Smart Warehouse Database Schema Setup for Supabase
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    password TEXT,
    image TEXT,
    "isAdmin" BOOLEAN DEFAULT false,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Household table
CREATE TABLE IF NOT EXISTS "Household" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create HouseholdMember table
CREATE TABLE IF NOT EXISTS "HouseholdMember" (
    "userId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("userId", "householdId"),
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    FOREIGN KEY ("householdId") REFERENCES "Household"(id) ON DELETE CASCADE
);

-- Create Room table
CREATE TABLE IF NOT EXISTS "Room" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("householdId") REFERENCES "Household"(id) ON DELETE CASCADE
);

-- Create Cabinet table
CREATE TABLE IF NOT EXISTS "Cabinet" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("roomId") REFERENCES "Room"(id) ON DELETE CASCADE
);

-- Create Category table
CREATE TABLE IF NOT EXISTS "Category" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    level INTEGER DEFAULT 1,
    "parentId" TEXT,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("parentId") REFERENCES "Category"(id) ON DELETE CASCADE,
    FOREIGN KEY ("householdId") REFERENCES "Household"(id) ON DELETE CASCADE
);

-- Create Item table
CREATE TABLE IF NOT EXISTS "Item" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    "minQuantity" INTEGER DEFAULT 0,
    barcode TEXT,
    "qrCode" TEXT,
    "imageUrl" TEXT,
    "categoryId" TEXT,
    "roomId" TEXT NOT NULL,
    "cabinetId" TEXT,
    "householdId" TEXT NOT NULL,
    "addedById" TEXT NOT NULL,
    "buyDate" TIMESTAMP(3),
    "buyCost" DECIMAL(10,2),
    "buyLocation" TEXT,
    "invoiceNumber" TEXT,
    "sellerName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("categoryId") REFERENCES "Category"(id) ON DELETE SET NULL,
    FOREIGN KEY ("roomId") REFERENCES "Room"(id) ON DELETE CASCADE,
    FOREIGN KEY ("cabinetId") REFERENCES "Cabinet"(id) ON DELETE SET NULL,
    FOREIGN KEY ("householdId") REFERENCES "Household"(id) ON DELETE CASCADE,
    FOREIGN KEY ("addedById") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create Activity table
CREATE TABLE IF NOT EXISTS "Activity" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    action TEXT NOT NULL,
    description TEXT,
    "performedBy" TEXT NOT NULL,
    "itemId" TEXT,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("performedBy") REFERENCES "User"(id) ON DELETE CASCADE,
    FOREIGN KEY ("itemId") REFERENCES "Item"(id) ON DELETE CASCADE,
    FOREIGN KEY ("householdId") REFERENCES "Household"(id) ON DELETE CASCADE
);

-- Create Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT false,
    "userId" TEXT NOT NULL,
    "itemId" TEXT,
    "householdId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    FOREIGN KEY ("itemId") REFERENCES "Item"(id) ON DELETE CASCADE,
    FOREIGN KEY ("householdId") REFERENCES "Household"(id) ON DELETE CASCADE
);

-- Create Account table (for NextAuth.js)
CREATE TABLE IF NOT EXISTS "Account" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
    UNIQUE(provider, "providerAccountId")
);

-- Create Session table (for NextAuth.js)
CREATE TABLE IF NOT EXISTS "Session" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "sessionToken" TEXT UNIQUE NOT NULL,
    "userId" TEXT NOT NULL,
    expires TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create VerificationToken table (for NextAuth.js)
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMP(3) NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"(email);
CREATE INDEX IF NOT EXISTS "idx_item_household" ON "Item"("householdId");
CREATE INDEX IF NOT EXISTS "idx_item_room" ON "Item"("roomId");
CREATE INDEX IF NOT EXISTS "idx_activity_household" ON "Activity"("householdId");
CREATE INDEX IF NOT EXISTS "idx_notification_user" ON "Notification"("userId");

-- Insert admin user
INSERT INTO "User" (id, email, name, password, "isAdmin", "emailVerified", "createdAt", "updatedAt")
VALUES (
    'admin-user-id',
    'sean.li@smtengo.com',
    'Sean Li (Admin)',
    '$2a$12$lmQ3QEA/KtYqMC2MkE5/3eXaykV62.vxejD2TvJ7XzISbceGqyR/6', -- Smtengo1324!
    true,
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    "isAdmin" = EXCLUDED."isAdmin",
    "emailVerified" = EXCLUDED."emailVerified",
    "updatedAt" = NOW();

-- Insert test user
INSERT INTO "User" (id, email, name, password, "isAdmin", "emailVerified", "createdAt", "updatedAt")
VALUES (
    'test-user-id',
    'sean.li@smtengo.com',
    'Sean Li (User)',
    '$2a$12$lmQ3QEA/KtYqMC2MkE5/3eXaykV62.vxejD2TvJ7XzISbceGqyR/6', -- Smtengo1324!
    false,
    NOW(),
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    password = EXCLUDED.password,
    "isAdmin" = EXCLUDED."isAdmin",
    "emailVerified" = EXCLUDED."emailVerified",
    "updatedAt" = NOW();

-- Insert admin household
INSERT INTO "Household" (id, name, description, "createdAt", "updatedAt")
VALUES (
    'admin-household',
    'Admin Household',
    'System administration household',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert test household
INSERT INTO "Household" (id, name, description, "createdAt", "updatedAt")
VALUES (
    'test-household',
    'Test Household',
    'Test household for regular users',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add admin user to admin household
INSERT INTO "HouseholdMember" ("userId", "householdId", role, "createdAt", "updatedAt")
VALUES (
    'admin-user-id',
    'admin-household',
    'OWNER',
    NOW(),
    NOW()
) ON CONFLICT ("userId", "householdId") DO NOTHING;

-- Add test user to test household
INSERT INTO "HouseholdMember" ("userId", "householdId", role, "createdAt", "updatedAt")
VALUES (
    'test-user-id',
    'test-household',
    'OWNER',
    NOW(),
    NOW()
) ON CONFLICT ("userId", "householdId") DO NOTHING;

-- Create test rooms
INSERT INTO "Room" (id, name, description, "householdId", "createdAt", "updatedAt")
VALUES (
    'test-kitchen',
    '廚房',
    'Kitchen',
    'test-household',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "Room" (id, name, description, "householdId", "createdAt", "updatedAt")
VALUES (
    'test-living',
    'Living Room',
    'Main living area',
    'test-household',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create test cabinets
INSERT INTO "Cabinet" (id, name, description, "roomId", "createdAt", "updatedAt")
VALUES (
    'test-right-cabinet',
    '右櫥櫃',
    'Right Cabinet',
    'test-kitchen',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "Cabinet" (id, name, description, "roomId", "createdAt", "updatedAt")
VALUES (
    'test-middle-cabinet',
    '中櫥櫃',
    'Middle Cabinet',
    'test-kitchen',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create test categories
INSERT INTO "Category" (id, name, level, "householdId", "createdAt", "updatedAt")
VALUES (
    'test-personal-care',
    'Personal Care',
    1,
    'test-household',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, level, "parentId", "householdId", "createdAt", "updatedAt")
VALUES (
    'test-wet-wipes',
    'Wet Wipes',
    2,
    'test-personal-care',
    'test-household',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, level, "householdId", "createdAt", "updatedAt")
VALUES (
    'test-food-beverages',
    'Food & Beverages',
    1,
    'test-household',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "Category" (id, name, level, "parentId", "householdId", "createdAt", "updatedAt")
VALUES (
    'test-cookies',
    'Cookies',
    2,
    'test-food-beverages',
    'test-household',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Create test items
INSERT INTO "Item" (id, name, description, quantity, "minQuantity", barcode, "categoryId", "roomId", "cabinetId", "householdId", "addedById", "createdAt", "updatedAt")
VALUES (
    'test-wet-wipes-item',
    'Taiwan Pure Water Wet Wipes',
    'Taiwan-made pure water wet wipes with ultra-high filtration',
    2,
    1,
    '4710901898748',
    'test-wet-wipes',
    'test-kitchen',
    'test-right-cabinet',
    'test-household',
    'test-user-id',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO "Item" (id, name, description, quantity, "minQuantity", barcode, "categoryId", "roomId", "cabinetId", "householdId", "addedById", "createdAt", "updatedAt")
VALUES (
    'test-oreo-item',
    'Mini Oreo Original Cookies',
    'Bite-sized chocolate cookies with vanilla cream filling',
    3,
    1,
    '7622300761349',
    'test-cookies',
    'test-kitchen',
    'test-middle-cabinet',
    'test-household',
    'test-user-id',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Database schema created successfully!' as message;
