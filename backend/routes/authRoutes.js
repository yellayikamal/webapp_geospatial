const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = require('express').Router();

const JWT_SECRET = 'your-secret-key'; // Replace with your secure secret key

// Registration Route
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const existingUser = User.findUser(username);
  
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
  
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { username, password: hashedPassword };
  
    User.addUser(newUser);
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(201).json({ message: 'User registered successfully', token });
  });
  
// Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = User.findUser(username);
  
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  
    // Use bcrypt to compare the hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
  
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ message: 'Login successful', token });
  });

module.exports = router;
