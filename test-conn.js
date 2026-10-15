import mongoose from 'mongoose';

const uri = 'mongodb+srv://antiqua220_db_user:XyyTFJ7Sr08C2H5I@nashikfilmcompany.ffv8ikj.mongodb.net/shootsync?retryWrites=true&w=majority&appName=NashikFilmCompany';

console.log('Testing connection to MongoDB...');
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
  console.log('SUCCESS: Successfully connected to MongoDB Atlas for Nashik Film Company!');
  console.log('Database name:', mongoose.connection.name);
  await mongoose.disconnect();
  console.log('Disconnected cleanly.');
} catch (err) {
  if (err.reason && err.reason.servers) {
    for (const [host, s] of err.reason.servers) {
      console.log('Server:', host, 'Error:', s.error);
    }
  } else {
    console.error('ERROR:', err);
  }
  process.exit(1);
}
