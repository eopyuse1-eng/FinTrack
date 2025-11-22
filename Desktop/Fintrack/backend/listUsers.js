const mongoose = require('mongoose');
const { User } = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://stoniecap_db_user:tb8xT2iPI0RNmUer@fintrackcluster.xbtympo.mongodb.net/?appName=FintrackCluster';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Function to list all users
async function listAllUsers() {
  try {
    const users = await User.find({})
      .select('firstName lastName email role department isActive createdAt')
      .sort({ role: 1, department: 1, createdAt: -1 });

    console.log('\n========== ALL USERS IN FINTRACK ==========\n');
    
    if (users.length === 0) {
      console.log('No users found in database.');
      process.exit(0);
    }

    // Group by role
    const groupedByRole = {};
    users.forEach(user => {
      if (!groupedByRole[user.role]) {
        groupedByRole[user.role] = [];
      }
      groupedByRole[user.role].push(user);
    });

    // Display grouped by role
    Object.keys(groupedByRole).sort().forEach(role => {
      console.log(`\n📋 ROLE: ${role.toUpperCase().replace(/_/g, ' ')}`);
      console.log('─'.repeat(80));
      
      groupedByRole[role].forEach((user, idx) => {
        console.log(`\n${idx + 1}. Name: ${user.firstName} ${user.lastName}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Department: ${user.department}`);
        console.log(`   Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
        console.log(`   Created: ${new Date(user.createdAt).toLocaleString()}`);
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\nTotal Users: ${users.length}`);
    
    // Summary by role
    console.log('\n📊 SUMMARY BY ROLE:');
    Object.keys(groupedByRole).sort().forEach(role => {
      console.log(`   ${role.toUpperCase().replace(/_/g, ' ')}: ${groupedByRole[role].length}`);
    });

    // Summary by department
    console.log('\n📍 SUMMARY BY DEPARTMENT:');
    const groupedByDept = {};
    users.forEach(user => {
      if (!groupedByDept[user.department]) {
        groupedByDept[user.department] = [];
      }
      groupedByDept[user.department].push(user);
    });
    Object.keys(groupedByDept).sort().forEach(dept => {
      console.log(`   ${dept.toUpperCase()}: ${groupedByDept[dept].length}`);
    });

    console.log('\n');
    process.exit(0);
  } catch (error) {
    console.error('Error listing users:', error);
    process.exit(1);
  }
}

listAllUsers();
