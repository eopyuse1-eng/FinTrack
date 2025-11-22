const mongoose = require('mongoose');
const { User } = require('./models/User');
require('dotenv').config();

async function listUsers() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://stoniecap_db_user:tb8xT2iPI0RNmUer@fintrackcluster.xbtympo.mongodb.net/?appName=FintrackCluster';
    await mongoose.connect(mongoUri);
    
    const users = await User.find({}, 'firstName lastName email department');
    console.log('All users:');
    users.forEach(u => {
      console.log(`${u.firstName} ${u.lastName} - ${u.department} (${u.email})`);
    });
    
    // Also search for anyone with "Joshua" in name
    const joshua = await User.find({ $or: [
      { firstName: { $regex: 'Joshua', $options: 'i' } },
      { lastName: { $regex: 'Joshua', $options: 'i' } }
    ]});
    
    if (joshua.length > 0) {
      console.log('\nFound Joshua:');
      joshua.forEach(u => {
        console.log(`${u.firstName} ${u.lastName} (${u._id})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

listUsers();
