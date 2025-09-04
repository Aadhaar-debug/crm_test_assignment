const mongoose = require('mongoose');
require('dotenv').config();

async function testUserLookup() {
  try {
    console.log('Testing user lookup...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Not set');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully');
    
    // Test finding the admin user
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    console.log('Looking for admin user...');
    const adminUser = await usersCollection.findOne({ email: 'admin@crm.com' });
    
    if (adminUser) {
      console.log('✅ Admin user found:');
      console.log('   Email:', adminUser.email);
      console.log('   Role:', adminUser.role);
      console.log('   Password length:', adminUser.password ? adminUser.password.length : 'undefined');
      console.log('   Is Active:', adminUser.isActive);
    } else {
      console.log('❌ Admin user not found');
    }
    
    // List all users
    console.log('\nAll users in database:');
    const allUsers = await usersCollection.find({}).toArray();
    allUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - Active: ${user.isActive}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testUserLookup();
