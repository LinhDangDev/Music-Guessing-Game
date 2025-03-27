const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

console.log('Testing direct MongoDB connection...');
console.log('Connection string (masked):', uri.replace(/:([^:@]+)@/, ':****@'));

const client = new MongoClient(uri);

async function testConnection() {
  try {
    // Connect to the MongoDB cluster
    await client.connect();
    console.log('✅ Connected successfully to MongoDB Atlas!');

    // List the available databases
    const dbs = await client.db().admin().listDatabases();
    console.log('Available databases:');
    dbs.databases.forEach(db => console.log(` - ${db.name}`));
  } catch (e) {
    console.error('❌ Connection error:', e);
  } finally {
    // Close the connection
    await client.close();
  }
}

testConnection().catch(console.error);
