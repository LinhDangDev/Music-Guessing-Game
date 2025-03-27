const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

console.log('Testing MongoDB connection...');
console.log('Connection string:', process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connection successful! Your MongoDB Atlas is correctly configured.');
    console.log('Database connection is ready to use.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed!', err);
    if (process.env.MONGODB_URI.includes('<db_username>') ||
        process.env.MONGODB_URI.includes('<db_password>')) {
      console.error('ERROR: You need to replace <db_username> and <db_password> in your .env file with your actual MongoDB Atlas credentials');
    }
    process.exit(1);
  });
