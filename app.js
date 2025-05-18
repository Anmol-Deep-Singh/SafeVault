const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db.js');
const { scheduleFraudDetection } = require('./src/jobs/fraudDetectionJob.js');
const userRoutes = require("./src/routes/userRoutes.js");
const authRoutes = require('./src/routes/authRoutes.js');
const reportRoutes = require('./src/routes/reportRoutes.js');
const adminRoutes = require('./src/routes/adminRoutes.js');
const cashRoutes = require('./src/routes/cashRoutes.js');

const app = express();
const PORT = 8000;

// Middleware(CORS)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware(logging the request)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
});

//Connection with the database
connectDB();

//Scheduling the fraud detection
scheduleFraudDetection();

//Routing for the API
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cash', cashRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
