const User = require('../models/User');
const router = express.Router();   // Still importing, but it now works with in-memory users

exports.register = (req, res) => {
  const { username, password } = req.body;
  
  // Check if the user already exists in the in-memory data
  const existingUser = User.findUser(username);
  
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Add the new user to the in-memory "database"
  const newUser = { username, password };
  User.addUser(newUser);

  return res.status(201).json({ message: 'User registered successfully' });
};

exports.login = (req, res) => {
  const { username, password } = req.body;

  // Check if the user exists and credentials match
  const user = User.findUser(username);
  
  if (!user || user.password !== password) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  return res.status(200).json({ message: 'Login successful' });
};
