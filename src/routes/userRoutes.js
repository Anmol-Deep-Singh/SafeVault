const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const Transaction = require('../models/transaction.js');

router.get('/', (req, res) => {
  res.send('This is the list of all the Users');
});

router.get('/:username', (req, res) => {
  res.send('This is the entered user');
});

router.post('/:username/withdraw', (req, res) => {
  res.send(`Withdraw endpoint for user: 50`);
});

router.post('/:username/deposit', (req, res) => {
  res.send(`Deposit endpoint for user: 50`);
});

module.exports = router;
