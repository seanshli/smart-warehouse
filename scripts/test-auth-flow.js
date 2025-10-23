const bcrypt = require('bcryptjs');

async function testAuthFlow() {
  console.log('🔐 Testing authentication flow...');
  
  const email = 'seanshlicn@gmail.com';
  const password = 'Smtengo1324!';
  
  // Simulate the auth flow
  console.log('1. Testing password hash verification...');
  const storedHash = '$2a$12$gJKy2S4VHUR/4zhbbwS/ruER2iPpfLk0J4RKh3RZe4NcTWsiytSju';
  const isValid = await bcrypt.compare(password, storedHash);
  console.log('Password verification:', isValid);
  
  if (!isValid) {
    console.log('❌ Password verification failed!');
    return;
  }
  
  console.log('✅ Password verification successful');
  console.log('2. Testing with fresh hash...');
  
  const freshHash = await bcrypt.hash(password, 12);
  const freshIsValid = await bcrypt.compare(password, freshHash);
  console.log('Fresh hash verification:', freshIsValid);
  
  console.log('3. Hash comparison:');
  console.log('Stored hash:', storedHash);
  console.log('Fresh hash: ', freshHash);
  console.log('Are they the same?', storedHash === freshHash);
}

testAuthFlow().catch(console.error);
