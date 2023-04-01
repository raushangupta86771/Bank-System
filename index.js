import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

// Initialize app
const app = express();

// Connect to MongoDB database
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB database'))
  .catch(error => console.error('Could not connect to MongoDB database', error));

// Define User schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  pin: { type: String, required: true },
  wallet: { type: Number, default: 0 },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
});


// Define Transaction schema
const transactionSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

// Define User model
const User = mongoose.model('User', userSchema);

// Define Transaction model
const Transaction = mongoose.model('Transaction', transactionSchema);

// Middleware
app.use(express.json());

// Routes

// Middleware to check for authorization
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Signup route
app.post('/signup', async (req, res) => {
  // Check if there are any validation errors
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return res.status(400).json({ errors: errors.array() });
  // }

  const { username, password, pin } = req.body;

  try {
    // Check if user with the given email already exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with the provided information
    user = new User({
      username,
      password: hashedPassword,
      pin
    });

    // Save the user to the database
    await user.save();

    res.json({ msg: 'User created' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// Login route
app.post('/login', async (req, res) => {
  // Check if there are any validation errors

  const { username, password, pin } = req.body;

  try {
    // Check if user with the given email exists
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if pin is correct
    if (pin !== user.pin) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate and sign a JWT token that includes the user ID and pin
    const payload = {
      user: {
        id: user.id,
        pin: user.pin
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1h'
    });

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// Add money route
app.post('/add-money', auth, async (req, res) => {
  try {
    const { amount, pin, username } = req.body;
    const user = await User.findOne({username});
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if the provided pin matches the user's pin
    const isPinValid = await bcrypt.compare(pin, user.pin);
    if (!isPinValid) {
      return res.status(401).json({ message: 'Invalid pin' });
    }

    // Add money to the user's wallet
    user.wallet += amount;
    await user.save();
    res.json({ message: 'Money added successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not add money' });
  }
});


// Pay money route
app.post('/pay-money', auth, async (req, res) => {
  try {
    const { username, amount } = req.body;
    const sender = await User.findById(req.userId);
    const receiver = await User.findOne({ username });
    if (!sender || !receiver) return res.status(404).json({ message: 'User not found' });
    if (sender.wallet < amount) return res.status(400).json({ message: 'Insufficient balance' });
    sender.wallet -= amount;
    receiver.wallet += amount;
    await sender.save();
    await receiver.save();
    const transaction = new Transaction({ sender: sender._id, receiver: receiver._id, amount });
    await transaction.save();
    sender.transactions.push(transaction);
    receiver.transactions.push(transaction);
    await sender.save();
    await receiver.save();
    res.json({ message: 'Money paid successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not pay money' });
  }
});

// Add the auth middleware to the /profile route
app.get('/profile', auth, async (req, res) => {
  try {
    // Find the user by ID and populate the 'transactions' field
    const user = await User.findById(req.userId).populate('transactions');
    console.log(req.userId)

    // If user is not found, return a 404 response
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the user's profile information
    res.json({ username: user.username, wallet: user.wallet, transactions: user.transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not get profile' });
  }
});


// Admin route
app.get('/admin', auth, async (req, res) => {
  try {
    const users = await User.find().select('username wallet transactions').populate('transactions');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not get users' });
  }
});

// Start server
app.listen(5000, () => console.log('Server started on port 5000'));
