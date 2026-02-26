// helper to connect to MongoDB with caching to avoid multiple connections in serverless environments
const mongoose = require('mongoose');

let cached = global.mongo;

if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

async function connect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined');
  }

  if (!cached.promise) {
    const opts = {
      // any mongoose options you need
      bufferCommands: false
    };
    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connect;