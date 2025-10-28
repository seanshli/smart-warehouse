# Smart Warehouse User Credentials

## 🔐 All User Accounts

### Production Admin Accounts

#### 1. Sean Li (Primary Admin)
- **Email**: `sean.li@smtengo.com`
- **Password**: `Smtengo1324!`
- **Role**: System Administrator
- **Permissions**: Full admin access

#### 2. Van Lee (Admin)
- **Email**: `van.lee@smtengo.com`
- **Password**: `Smtengo1324!`
- **Role**: System Administrator
- **Permissions**: Full admin access

#### 3. Max Lin (Admin)
- **Email**: `max.lin@smtengo.com`
- **Password**: `Smtengo1324!`
- **Role**: System Administrator
- **Permissions**: Full admin access

### Test Accounts

#### 1. Admin Account (Test)
- **Email**: `admin@smartwarehouse.com`
- **Password**: `admin123`
- **Role**: System Administrator
- **Permissions**: Full admin access

#### 2. Demo Account
- **Email**: `demo@smartwarehouse.com`
- **Password**: `demo123`
- **Role**: Regular User
- **Permissions**: Standard user access

#### 3. Test User Account
- **Email**: `test@example.com`
- **Password**: `test123`
- **Role**: Regular User
- **Permissions**: Standard user access

#### 4. Regular Test User
- **Email**: `user@smartwarehouse.com`
- **Password**: `user123`
- **Role**: Regular User
- **Permissions**: Standard user access

#### 5. Alice Account
- **Email**: `alice@smartwarehouse.com`
- **Password**: `alice123`
- **Role**: Regular User
- **Permissions**: Standard user access

#### 6. Bob Account
- **Email**: `bob@smartwarehouse.com`
- **Password**: `bob123`
- **Role**: Regular User
- **Permissions**: Standard user access

#### 7. Carol Account
- **Email**: `carol@smartwarehouse.com`
- **Password**: `carol123`
- **Role**: Regular User
- **Permissions**: Standard user access

#### 8. Additional Admin Account
- **Email**: `seanshlitw@gmail.com`
- **Password**: `smtengo888`
- **Role**: System Administrator
- **Permissions**: Full admin access

#### 9. Sean Li Mac Account
- **Email**: `seanshli@mac.com`
- **Password**: `Smtengo1324!`
- **Role**: System Administrator
- **Permissions**: Full admin access

## 🔄 Password Reset

If you need to reset a password, you can use the script:

```bash
cd /var/www/smartwarehouse
node scripts/setup-user-credentials.js
```

Or manually reset via SQL:

```sql
-- Generate a new password hash (use bcrypt)
UPDATE user_credentials 
SET password = '$2a$12$HASH_HERE' 
WHERE user_id = (SELECT id FROM users WHERE email = 'email@here.com');
```

## 🛡️ Security Notes

1. **Production Environment**: 
   - Change all default passwords immediately
   - Use strong, unique passwords
   - Enable 2FA if available

2. **Password Hashing**: 
   - All passwords are hashed using bcrypt with 12 rounds
   - Never store plaintext passwords

3. **Session Management**: 
   - Sessions managed by NextAuth.js
   - Automatic session expiration after inactivity

## 📝 Testing Login

To test if a user can log in:

```bash
node scripts/test-auth.js
```

Or use the test API endpoint:

```bash
curl -X POST http://localhost:3000/api/test-login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@smartwarehouse.com","password":"demo123"}'
```

## 🔐 Admin Access URLs

- **Admin Dashboard**: `/admin`
- **Household Management**: `/admin/households`
- **Items Management**: `/admin/items`
- **Analytics**: `/admin/analytics`
- **System Settings**: `/admin/settings`

## ⚠️ Important Reminders

1. All test accounts are for **development and testing purposes only**
2. In production, **change all default passwords immediately**
3. Regularly audit user accounts and permissions
4. Monitor login attempts and failed authentications
5. Keep backup of user credentials in a secure location

## 📊 User Account Summary

| Email | Password | Role | Status |
|-------|----------|------|--------|
| sean.li@smtengo.com | Smtengo1324! | Admin | Active |
| van.lee@smtengo.com | Smtengo1324! | Admin | Active |
| max.lin@smtengo.com | Smtengo1324! | Admin | Active |
| admin@smartwarehouse.com | admin123 | Admin | Active |
| seanshlitw@gmail.com | smtengo888 | Admin | Active |
| demo@smartwarehouse.com | demo123 | User | Active |
| test@example.com | test123 | User | Active |
| user@smartwarehouse.com | user123 | User | Active |
| alice@smartwarehouse.com | alice123 | User | Active |
| bob@smartwarehouse.com | bob123 | User | Active |
| carol@smartwarehouse.com | carol123 | User | Active |

---

**Last Updated**: October 28, 2025
**Maintained By**: System Administrator

