const express = require('express');
const router = express.Router();
const { validateRegistration, validateLogin } = require('../controllers/validationMiddleware.js');
const { loginUser, registerUser } = require('../controllers/loginController.js');

router.post('/login',validateLogin,loginUser);

router.post('/register',validateRegistration,registerUser);

router.post('/verify', (req, res) => {
  res.send(`Post method to verify the otp`);
});


router.post('/transaction', (req, res) => {
  res.send(`Post method to verify the transaction`);
});


module.exports = router;