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

// Function to update birthdates
async function updateBirthdates() {
  try {
    // Get all employees (regardless of role)
    const employees = await User.find({});
    const activeEmployees = employees.filter(e => e.role === 'employee' || e.firstName);
    console.log(`Found ${activeEmployees.length} users in database`);
    console.log(`Users:`, activeEmployees.map(e => `${e.firstName} ${e.lastName} (${e.role})`).join(', '));

    // Generate random birthdates between 1985 and 2005
    for (let i = 0; i < activeEmployees.length; i++) {
      const randomYear = Math.floor(Math.random() * (2005 - 1985 + 1)) + 1985;
      const randomMonth = Math.floor(Math.random() * 12);
      const randomDay = Math.floor(Math.random() * 28) + 1;
      
      const birthdate = new Date(randomYear, randomMonth, randomDay);
      
      activeEmployees[i].birthdate = birthdate;
      await activeEmployees[i].save();
      
      console.log(`Updated ${activeEmployees[i].firstName} ${activeEmployees[i].lastName} with birthdate: ${birthdate.toISOString().split('T')[0]}`);
    }

    console.log('✅ All employees updated with birthdates!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating birthdates:', error);
    process.exit(1);
  }
}

updateBirthdates();
