const express = require('express');
const connectDB = require('./src/config/db.js');

const userRoutes = require("./src/routes/userRoutes.js");
const transactionRoutes = require('./src/routes/transactionRoutes.js');
const otpRoutes = require('./src/routes/otpRoutes.js');

const app = express();
const PORT = 8000;

app.use(express.json());

// Connect to DB
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/otp', otpRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
