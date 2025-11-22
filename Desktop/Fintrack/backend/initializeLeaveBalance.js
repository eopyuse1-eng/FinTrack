const mongoose = require('mongoose');
const { User } = require('./models/User');
require('dotenv').config();

async function initializeLeaveBalance() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://stoniecap_db_user:tb8xT2iPI0RNmUer@fintrackcluster.xbtympo.mongodb.net/?appName=FintrackCluster';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Update all users without leave balance
    const result = await User.updateMany(
      { annualLeaveBalance: { $exists: false } },
      {
        $set: {
          annualLeaveBalance: 15,
          leaveBalanceResetDate: new Date(new Date().getFullYear(), 11, 31),
        },
      }
    );

    console.log(`Updated ${result.modifiedCount} users with leave balance initialization`);
    console.log(`Matched ${result.matchedCount} users`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error initializing leave balance:', error);
    process.exit(1);
  }
}

initializeLeaveBalance();
