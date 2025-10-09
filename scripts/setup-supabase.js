#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupSupabase() {
  console.log('🚀 Supabase Setup for Smart Warehouse\n');
  
  console.log('📋 Prerequisites:');
  console.log('1. Create a Supabase project at https://supabase.com');
  console.log('2. Get your database connection string from Settings → Database\n');
  
  // Get Supabase connection details
  const projectUrl = await question('Enter your Supabase Project URL (e.g., https://xyz.supabase.co): ');
  const dbPassword = await question('Enter your Database Password: ');
  const apiKey = await question('Enter your API Key (anon public): ');
  
  // Extract project reference from URL
  const projectRef = projectUrl.replace('https://', '').replace('.supabase.co', '');
  
  // Construct database URL
  const databaseUrl = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;
  
  console.log('\n🔧 Configuration:');
  console.log(`Project URL: ${projectUrl}`);
  console.log(`Database URL: ${databaseUrl}`);
  console.log(`API Key: ${apiKey}`);
  
  // Create environment file
  const envContent = `# Supabase Configuration
DATABASE_URL="${databaseUrl}"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret-key-here"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="${projectUrl}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${apiKey}"

# OpenAI API (if using AI features)
OPENAI_API_KEY="your-openai-api-key"

# Capacitor Server URL (update after deployment)
CAP_SERVER_URL="https://your-domain.com"
`;

  console.log('\n📝 Environment Variables:');
  console.log('Copy these to your .env.local file or hosting service:');
  console.log('─'.repeat(50));
  console.log(envContent);
  console.log('─'.repeat(50));
  
  // Test database connection
  console.log('\n🧪 Testing Database Connection...');
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log(`📊 Found ${tables.length} tables in database`);
    
    if (tables.length === 0) {
      console.log('\n🔄 Running database migrations...');
      console.log('Run these commands to set up your database:');
      console.log('1. npx prisma migrate deploy');
      console.log('2. npx prisma db seed');
    } else {
      console.log('✅ Database already has tables - migrations may have been run');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your database password');
    console.log('2. Ensure your Supabase project is active');
    console.log('3. Verify the connection string format');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Save the environment variables to your hosting service');
  console.log('2. Run: npx prisma migrate deploy');
  console.log('3. Run: npx prisma db seed');
  console.log('4. Deploy your app to Vercel/Railway/etc.');
  console.log('5. Update CAP_SERVER_URL with your deployed domain');
  console.log('6. Run: npm run ios:production');
  
  console.log('\n🎉 Supabase setup complete!');
  
  rl.close();
}

setupSupabase().catch(console.error);
