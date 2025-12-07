# Database Connection Check

## Supabase Database Connection

### Environment Variables Required

1. **DATABASE_URL** - Supabase PostgreSQL connection string
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true&connection_limit=1`
   - Should be set in Vercel environment variables

### Vercel Configuration

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Ensure `DATABASE_URL` is set for Production, Preview, and Development
3. Format should include Supabase connection parameters:
   ```
   postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?pgbouncer=true&connection_limit=1&sslmode=require
   ```

### Connection Test

To verify database connection:
1. Check Vercel deployment logs for database connection errors
2. Look for Prisma connection errors in API route logs
3. Test API endpoint: `/api/admin/users` (should return users if connected)

### Common Issues

1. **Connection Timeout**
   - Check if DATABASE_URL is correct
   - Verify Supabase project is active
   - Check if IP is whitelisted in Supabase

2. **SSL Required**
   - Ensure `sslmode=require` is in connection string
   - Supabase requires SSL connections

3. **Connection Pool**
   - Use `pgbouncer=true` for connection pooling
   - Set `connection_limit=1` for Vercel serverless

### Prisma Configuration

The Prisma client is configured in `lib/prisma.ts`:
- Production: Uses SSL and connection pooling
- Development: Uses default settings
- Connection timeout: 10 seconds
- Max wait: 5 seconds

