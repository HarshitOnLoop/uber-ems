/**
 * Fix MongoDB E11000 Duplicate Key Error
 * Run this once to drop problematic indexes and restart
 */

require("dotenv").config();
const mongoose = require("mongoose");

const fixIndexes = async () => {
  try {
    console.log("🔧 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");
    
    console.log("📊 Getting existing indexes...");
    const indexes = await usersCollection.listIndexes().toArray();
    console.log("Current indexes:", indexes.map(i => i.name));
    
    // Drop all indexes except _id
    console.log("🗑️  Dropping problematic indexes...");
    for (const index of indexes) {
      if (index.name !== "_id_") {
        console.log(`   Dropping: ${index.name}`);
        await usersCollection.dropIndex(index.name);
      }
    }
    
    // Recreate proper indexes with sparse: true
    console.log("✨ Creating new indexes with sparse: true...");
    
    await usersCollection.createIndex({ email: 1 }, { unique: true, sparse: true });
    console.log("   ✓ email (unique, sparse)");
    
    await usersCollection.createIndex({ customId: 1 }, { unique: true, sparse: true });
    console.log("   ✓ customId (unique, sparse)");
    
    console.log("\n✅ Indexes fixed successfully!");
    console.log("🎉 You can now signup without E11000 errors");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
};

fixIndexes();
