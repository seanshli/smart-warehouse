const bcrypt = require('bcryptjs');

async function generateHashes() {
  console.log('🔐 Generating password hashes...');
  
  const password = 'Smtengo1324!';
  
  const passwordHash = await bcrypt.hash(password, 12);
  
  console.log('\n📋 Password Hash:');
  console.log('Password (Smtengo1324!):', passwordHash);
  
  console.log('\n📝 SQL Commands:');
  console.log('-- Update admin password:');
  console.log(`UPDATE "User" SET password = '${passwordHash}' WHERE email = 'sean.li@smtengo.com' AND "isAdmin" = true;`);
  console.log('\n-- Update user password:');
  console.log(`UPDATE "User" SET password = '${passwordHash}' WHERE email = 'sean.li@smtengo.com' AND "isAdmin" = false;`);
}

generateHashes().catch(console.error);

