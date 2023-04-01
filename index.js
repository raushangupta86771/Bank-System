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

// Define User class
class User {
  constructor(username, password, pin) {
    this.username = username;
    this.password = password;
    this.pin = pin;
    this.wallet = 0;
    this.transactions = [];
  }
}

User.schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  pin: { type: String, required: true },
  wallet: { type: Number, default: 0 },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }]
});

User.model = mongoose.model('User', User.schema);

// Define Transaction class
class Transaction {
  constructor(sender, receiver, amount) {
    this.sender = sender;
    this.receiver = receiver;
    this.amount = amount;
    this.date = Date.now();
  }
}

Transaction.schema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

Transaction.model = mongoose.model('Transaction', Transaction.schema);

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
  const { username, password, pin } = req.body;

  try {
    // Check if user with the given email already exists
    let user = await User.model.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Generate a salt and hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with the provided information
    user = new User(username, hashedPassword, pin);

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
  const { username, password, pin } = req.body;

  try {
    // Check if user with the given email exists
    let user = await User.model.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Check if the password and pin match the user's stored password and pin
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    const isPinMatch = await bcrypt.compare(pin, user.pin);
    if (!isPasswordMatch || !isPinMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    // Create and sign a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get current user's profile route
app.get('/profile', auth, async (req, res) => {
  try {
    // Find the current user's profile using the userId obtained from the auth middleware
    const user = await User.model.findById(req.userId).populate('transactions', '-_id -__v');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Transfer money route
app.post('/transfer', auth, async (req, res) => {
  const { receiverUsername, amount } = req.body;

  try {
    // Find the current user and the receiver using their usernames
    const sender = await User.model.findById(req.userId);
    const receiver = await User.model.findOne({ username: receiverUsername });

    // Check if the receiver exists
    if (!receiver) {
      return res.status(400).json({ msg: 'Receiver does not exist' });
    }

    // Check if the sender has enough money in their wallet
    if (sender.wallet < amount) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Deduct the amount from the sender's wallet and add it to the receiver's wallet
    sender.wallet -= amount;
    receiver.wallet += amount;

    // Create a new transaction and add it to both the sender's and receiver's transactions arrays
    const transaction = new Transaction(sender._id, receiver._id, amount);
    await transaction.save();
    sender.transactions.push(transaction);
    receiver.transactions.push(transaction);

    // Save the sender and receiver to the database
    await sender.save();
    await receiver.save();

    res.json({ msg: 'Transaction successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Start server
app.listen(process.env.PORT, () => console.log("Server running on port ${ process.env.PORT }"));
