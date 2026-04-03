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
      amount: amount * 100, // paisa me convert
      currency: "INR",
      receipt: "order_receipt"
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};