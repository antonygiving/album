const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const axios = require('axios');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const Order = require('./models/Order');
const Subscriber = require('./models/Subscriber');
const Track = require('./models/Track');
const { sendOrderConfirmation } = require('./emailUtils');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

let dbConnected = false;

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Multer configuration for audio file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'audio/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /mp3|wav|flac|aac|ogg|m4a/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: fileFilter
});

// PayPal configuration
const environment = new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
const client = new paypal.core.PayPalHttpClient(environment);

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// M-Pesa utility functions
async function getAccessToken() {
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const response = await axios.get(`${process.env.MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`
    }
  });
  return response.data.access_token;
}

async function initiateSTKPush(phoneNumber, amount, accountReference, transactionDesc) {
  const accessToken = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

  const response = await axios.post(`${process.env.MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: `${process.env.BASE_URL || 'http://localhost:3000'}/api/mpesa/callback`,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  return response.data;
}

const app = express();

app.use(cors());

// Stripe Webhook (must be before express.json())
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    // Update order status
    const order = await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', orderStatus: 'paid' }, { new: true });

    // Send order confirmation email
    try {
      await sendOrderConfirmation(order.customer.email, order);
    } catch (emailError) {
      console.error('Error sending order confirmation email for Stripe:', emailError);
    }
  }

  res.json({ received: true });
});

app.use(express.json());

// MongoDB connection with event listeners for graceful handling
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/albumdb', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB successfully');
  dbConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err.message);
  dbConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  dbConnected = false;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing MongoDB connection...');
  await mongoose.connection.close();
  process.exit(0);
});

app.use(express.static('.'));

// Create Payment Intent
app.post('/api/create-payment-intent', async (req, res) => {
  console.log('API: create-payment-intent called');
  try {
    const { customer, items, totalAmount } = req.body;

    // Create order
    const order = new Order({
      customer,
      items,
      totalAmount,
      paymentMethod: 'stripe',
      paymentStatus: 'pending',
      orderStatus: 'pending'
    });

    await order.save();

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount * 100, // assuming USD in cents
      currency: 'usd',
      metadata: { orderId: order._id.toString() }
    });

    res.json({ client_secret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Create PayPal Order
app.post('/api/create-paypal-order', async (req, res) => {
  console.log('API: create-paypal-order called');
  try {
    const { customer, items, totalAmount } = req.body;

    // Create order
    const order = new Order({
      customer,
      items,
      totalAmount,
      paymentMethod: 'paypal',
      paymentStatus: 'pending',
      orderStatus: 'pending'
    });

    await order.save();

    // Create PayPal order
    const request = new paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: totalAmount.toString()
        },
        custom_id: order._id.toString()
      }]
    });

    const response = await client.execute(request);
    res.json({ orderId: response.result.id });
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Capture PayPal Order
app.post('/api/capture-paypal-order', async (req, res) => {
  try {
    const { orderId } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    const response = await client.execute(request);

    const customId = response.result.purchase_units[0].custom_id;
    const order = await Order.findByIdAndUpdate(customId, { paymentStatus: 'paid', orderStatus: 'paid' }, { new: true });

    // Send order confirmation email
    try {
      await sendOrderConfirmation(order.customer.email, order);
    } catch (emailError) {
      console.error('Error sending order confirmation email for PayPal:', emailError);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// M-Pesa STK Push
app.post('/api/mpesa/stkpush', async (req, res) => {
  try {
    const { phoneNumber, customer, items, totalAmount } = req.body;

    // Create order
    const order = new Order({
      customer,
      items,
      totalAmount,
      paymentMethod: 'mpesa',
      paymentStatus: 'pending',
      orderStatus: 'pending'
    });

    await order.save();

    // Initiate STK Push
    const stkResponse = await initiateSTKPush(phoneNumber, totalAmount, order._id.toString(), 'Payment for order');

    // Update order with checkoutRequestId
    await Order.findByIdAndUpdate(order._id, { checkoutRequestId: stkResponse.CheckoutRequestID });

    res.json({ success: true, checkoutRequestId: stkResponse.CheckoutRequestID });
  } catch (error) {
    console.error('Error initiating M-Pesa STK Push:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// M-Pesa Callback
app.post('/api/mpesa/callback', async (req, res) => {
  try {
    const { Body } = req.body;
    const { stkCallback } = Body;

    if (stkCallback.ResultCode === 0) {
      const checkoutRequestId = stkCallback.CheckoutRequestID;

      // Find and update order
      const order = await Order.findOneAndUpdate(
        { checkoutRequestId },
        { paymentStatus: 'paid', orderStatus: 'paid' },
        { new: true }
      );

      // Send order confirmation email
      try {
        await sendOrderConfirmation(order.customer.email, order);
      } catch (emailError) {
        console.error('Error sending order confirmation email for M-Pesa:', emailError);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling M-Pesa callback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    // Temporary plain text password for development
    const isValid = password === 'admin123';
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Subscribe endpoint
app.post('/api/subscribe', async (req, res) => {
  console.log('API: subscribe called');
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    const existing = await Subscriber.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'Email already subscribed' });
    }
    const subscriber = new Subscriber({ email: email.toLowerCase().trim() });
    await subscriber.save();
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin tracks endpoints
app.post('/api/admin/tracks', authMiddleware, async (req, res) => {
  try {
    const { id, title, story, spotify, appleMusic, youtube, audioFile } = req.body;
    if (!id || !title || !story || !spotify || !appleMusic || !youtube || !audioFile) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const track = new Track({ id, title, story, spotify, appleMusic, youtube, audioFile });
    await track.save();
    res.status(201).json(track);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Track with this id already exists' });
    }
    console.error('Error creating track:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.put('/api/admin/tracks/:id', authMiddleware, async (req, res) => {
  try {
    const { title, story, spotify, appleMusic, youtube, audioFile } = req.body;
    const track = await Track.findOneAndUpdate(
      { id: req.params.id },
      { title, story, spotify, appleMusic, youtube, audioFile },
      { new: true }
    );
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json(track);
  } catch (error) {
    console.error('Error updating track:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.delete('/api/admin/tracks/:id', authMiddleware, async (req, res) => {
  try {
    const track = await Track.findOneAndDelete({ id: req.params.id });
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json({ message: 'Track deleted successfully' });
  } catch (error) {
    console.error('Error deleting track:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/admin/seed-tracks', authMiddleware, async (req, res) => {
  try {
    const tracksData = [
      { id: 1, title: "NAH!", story: "Opening statement. Setting the tone for the entire album. This is where it all begins - the raw energy, the attitude, the declaration that things are about to change. No holding back, no apologies. Just pure, unfiltered expression from the heart.", spotify: "https://open.spotify.com/track/example1", appleMusic: "https://music.apple.com/track/example1", youtube: "https://youtube.com/watch?v=example1", audioFile: "audio/track1.mp3" },
      { id: 2, title: "PUNGUZA STRESS", story: "Life moves fast, stress builds up. This track is about finding that peace, reducing the pressure, and learning to breathe again. A reminder that we control our energy and our response to the chaos around us. Keep it light, keep it moving.", spotify: "https://open.spotify.com/track/example2", appleMusic: "https://music.apple.com/track/example2", youtube: "https://youtube.com/watch?v=example2", audioFile: "audio/track2.mp3" },
      { id: 3, title: "NIKO FRESH", story: "That feeling when everything clicks. When you wake up and know today is your day. This is the confidence track, the swagger anthem. Walking through life with your head high, knowing you've got what it takes. Fresh energy, fresh mindset, fresh perspective.", spotify: "https://open.spotify.com/track/example3", appleMusic: "https://music.apple.com/track/example3", youtube: "https://youtube.com/watch?v=example3", audioFile: "audio/track3.mp3" },
      { id: 4, title: "FASHION", story: "Style isn't just about clothes - it's about how you carry yourself, how you present to the world. This track celebrates the culture, the drip, the aesthetic. Looking good, feeling better. Fashion as a form of self-expression and confidence.", spotify: "https://open.spotify.com/track/example4", appleMusic: "https://music.apple.com/track/example4", youtube: "https://youtube.com/watch?v=example4", audioFile: "audio/track4.mp3" },
      { id: 5, title: "FASTER,", story: "Momentum. Acceleration. When you're moving so fast the world becomes a blur. This is about that grind, that hustle, that unstoppable drive. No time to slow down, no time to look back. Keep pushing, keep moving, faster than yesterday.", spotify: "https://open.spotify.com/track/example5", appleMusic: "https://music.apple.com/track/example5", youtube: "https://youtube.com/watch?v=example5", audioFile: "audio/track5.mp3" },
      { id: 6, title: "LOVE", story: "Getting vulnerable. Opening up. This is the heart track, where the walls come down and the real emotions come through. Love in all its forms - romantic, familial, self-love. The most powerful force we have, expressed through bars and beats.", spotify: "https://open.spotify.com/track/example6", appleMusic: "https://music.apple.com/track/example6", youtube: "https://youtube.com/watch?v=example6", audioFile: "audio/track6.mp3" },
      { id: 7, title: "BOSSY", story: "Taking control. Making decisions. Being the boss of your own life. This is the power anthem, the leadership track. When you know what you want and you're not afraid to go get it. Confidence meets action, and nobody's gonna stop you.", spotify: "https://open.spotify.com/track/example7", appleMusic: "https://music.apple.com/track/example7", youtube: "https://youtube.com/watch?v=example7", audioFile: "audio/track7.mp3" }
    ];
    await Track.insertMany(tracksData, { ordered: false });
    res.json({ message: 'Tracks seeded successfully' });
  } catch (error) {
    console.error('Error seeding tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tracks for admin
app.get('/api/admin/tracks', authMiddleware, async (req, res) => {
  try {
    const tracks = await Track.find().sort({ id: 1 });
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload track with file
app.post('/api/admin/upload-track', authMiddleware, upload.single('audioFile'), async (req, res) => {
  try {
    const { id, title, story, spotify, appleMusic, youtube } = req.body;
    if (!id || !title || !story || !spotify || !appleMusic || !youtube || !req.file) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    const audioFile = req.file.path;
    const track = new Track({ id: parseInt(id), title, story, spotify, appleMusic, youtube, audioFile });
    await track.save();
    res.status(201).json(track);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Track with this id already exists' });
    }
    console.error('Error uploading track:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tracks
app.get('/api/tracks', async (req, res) => {
  try {
    const tracks = await Track.find().sort({ id: 1 });
    res.json(tracks);
  } catch (error) {
    console.error('Error fetching tracks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all orders for admin
app.get('/api/admin/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all subscribers for admin
app.get('/api/admin/subscribers', authMiddleware, async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
    res.json(subscribers);
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;

// General error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});