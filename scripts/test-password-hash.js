const bcrypt = require('bcryptjs');

async function testPasswordHash() {
  console.log('🔐 Testing password hash...');
  
  const password = 'Smtengo1324!';
  const storedHash = '$2a$12$gJKy2S4VHUR/4zhbbwS/ruER2iPpfLk0J4RKh3RZe4NcTWsiytSju';
  
  console.log('Password:', password);
  console.log('Stored hash:', storedHash);
  
  const isValid = await bcrypt.compare(password, storedHash);
  console.log('Password verification result:', isValid);
  
  // Also test with a fresh hash
  const freshHash = await bcrypt.hash(password, 12);
  console.log('Fresh hash:', freshHash);
  
  const freshIsValid = await bcrypt.compare(password, freshHash);
  console.log('Fresh hash verification:', freshIsValid);
}

testPasswordHash().catch(console.error);
