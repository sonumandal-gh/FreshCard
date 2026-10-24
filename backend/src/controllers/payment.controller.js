const razorpay = require("../config/razorpay");

// create order
exports.createPaymentOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    // basic validation
    if (!amount) {
      return res.status(400).json({
        message: "Amount required"
      });
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // convert to paise as clean integer
      currency: "INR",
      receipt: `order_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};