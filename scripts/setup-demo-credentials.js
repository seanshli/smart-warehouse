const bcrypt = require('bcryptjs');

// Simple in-memory storage for demo purposes
// In production, use a proper database table
const userPasswords = new Map();

async function setupDemoCredentials() {
  console.log('🔐 Setting up demo credentials...');
  
  // Hash the demo password
  const hashedPassword = await bcrypt.hash('demo123', 12);
  
  // Store the demo user's password
  userPasswords.set('demo@smartwarehouse.com', hashedPassword);
  
  console.log('✅ Demo credentials set up');
  console.log('📧 Email: demo@smartwarehouse.com');
  console.log('🔑 Password: demo123');
  
  // Export the credentials for the app to use
  global.demoCredentials = userPasswords;
}

setupDemoCredentials();

