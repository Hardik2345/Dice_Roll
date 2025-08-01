#!/usr/bin/env node
/**
 * Script to create a default admin user.
 * Usage: node createAdmin.js [username] [password] [email]
 * If no args provided, falls back to environment variables or defaults.
 */

const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

async function main() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dice-roll-app';
  await mongoose.connect(mongoUri, {
    // mongoose v6 auto manages options
  });
  console.log(`Connected to MongoDB at ${mongoUri}`);

  const username = process.argv[2] || process.env.ADMIN_USERNAME || 'admin';
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'admin123';
  const email = process.argv[4] || process.env.ADMIN_EMAIL || `admin@${process.env.SHOPIFY_STORE_URL || 'example.com'}`;

  const existing = await Admin.findOne({ username });
  if (existing) {
    console.log(`Admin user '${username}' already exists.`);
    process.exit(0);
  }

  const admin = new Admin({ username, password, email });
  await admin.save();
  console.log('Created admin user:');
  console.log(`  Username: ${username}`);
  console.log(`  Password: ${password}`);
  console.log(`  Email:    ${email}`);
  console.log('Please change the password after first login.');

  process.exit(0);
}

main().catch(err => {
  console.error('Error creating admin user:', err);
  process.exit(1);
});
