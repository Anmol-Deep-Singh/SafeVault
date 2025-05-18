const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { depositCash, withdrawCash, getCashTransactions } = require('../controllers/cashController');


router.use(auth);


router.post('/deposit', depositCash);


router.post('/withdraw', withdrawCash);


router.get('/transactions', getCashTransactions);

module.exports = router; 