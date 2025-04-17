// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

const app = express();

// Middleware
app.use(cors({
    origin: 'https://dnq-fashion.vercel.app' 
}));
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the DNQ Fashion Backend API!' });
});

// Sử dụng routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

// Export app để Vercel sử dụng
module.exports = app;