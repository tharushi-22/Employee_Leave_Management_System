const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Import models
    const User = require('./models/User');
    const AuditLog = require('./models/AuditLog');
    const Leave = require('./models/Leave');

    // Clear existing data
    await User.deleteMany({});
    await Leave.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('✅ Cleared existing data');

    // Create users
    const usersData = [
      {
        email: 'admin@gmail.com',
        password: 'admin123',
        role: 'admin',
        name: 'Admin User'
      },
      {
        email: 'employee@gmail.com',
        password: 'employee123',
        role: 'employee',
        name: 'Jane Doe'
      },
      {
        email: 'john@gmail.com',
        password: 'john123',
        role: 'employee',
        name: 'John Smith'
      }
    ];

    const createdUsers = [];
    for (const userData of usersData) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const user = new User({
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        name: userData.name
      });

      await user.save();
      createdUsers.push(user);
      console.log(`✅ Created ${userData.role}: ${userData.email}`);
    }

    // Create admin audit log
    const adminUser = createdUsers.find(u => u.role === 'admin');
    if (adminUser) {
      const sampleLogs = [
        {
          action: 'user_logged_in',
          user: adminUser._id,
          description: 'Admin logged in via seed script',
          ipAddress: '127.0.0.1',
          userAgent: 'Seeder Script',
          timestamp: new Date()
        }
      ];

      await AuditLog.insertMany(sampleLogs);
      console.log('✅ Created audit logs');
    }

    console.log('\n🎉 Database seeding completed!');
    console.log('\nTest accounts created:');
    console.log('1. admin@gmail.com / admin123 (Admin)');
    console.log('2. employee@gmail.com / employee123 (Employee)');
    console.log('3. john@gmail.com / john123 (Employee)');

    await mongoose.disconnect();
    console.log('✅ MongoDB connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seed error:', error.message);
    
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore
    }
    
    process.exit(1);
  }
}

seedDatabase();