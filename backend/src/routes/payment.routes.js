const express = require("express");
const router = express.Router();

const {createPaymentOrder} = require("../controllers/payment.controller");

router.post("/create-order", createPaymentOrder);

router.get("/test", (req, res) => {
  res.send("Payment route working");
});

module.exports = router;