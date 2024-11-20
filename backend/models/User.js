// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define the User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Method to compare password during login
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compareSync(password, this.password);  // Compare hashed password
};

// Create a model from the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
