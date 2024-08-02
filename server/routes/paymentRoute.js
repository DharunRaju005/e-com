const express = require('express');
const { makePayment, webHook,getPayment } = require('../controllers/paymentController');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

router.post("/proceedToPay", verifyToken, makePayment);
router.post("/webhook", express.raw({ type: 'application/json' }), webHook);
router.get("/",verifyToken,getPayment);

module.exports = router;
