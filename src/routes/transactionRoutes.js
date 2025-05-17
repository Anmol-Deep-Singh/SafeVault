const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction.js');
const User = require('../models/user.js');

router.get('/', (req, res) => {
  res.send('This is the the list of all the transactions');
});
//all the rest query parameters are left for now because of no logical idea with it

module.exports = router;
