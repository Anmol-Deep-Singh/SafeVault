const express = require('express');
const router = express.Router();


router.post('/verify', (req, res) => {
  res.send(`Post method to verify the otp`);
});


router.post('/transaction', (req, res) => {
  res.send(`Post method to verify the transaction`);
});


module.exports = router;