const Order = require("../models/order.model");
const Product = require("../models/product.model");

// ORDER CREATE
exports.createOrder = async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No products in order"
      });
    }

    let totalPrice = 0;

    // calculate total
    for (let item of products) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      totalPrice += product.price * item.quantity;
    }

    const order = await Order.create({
      userId: req.user.id,         
      products,              
      totalPrice             
    });

    res.status(201).json({
      success: true,
      message: "Order created",
      order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "server error",
      error: error.message
    });
  }
};

// GET USER ORDERS (My Orders)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate("products.productId", "name price image")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "User orders fetched",
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "server error",
      error: error.message
    });
  }
};

// GET ALL ORDERS (with populate)
exports.getOrders = async (req ,res) => {
  try {
    const orders = await Order.find()
    .populate("userId","name email") // user ka data
    .populate("products.productId", "name price");

    res.status(200).json({
      success: true,
      message: "Orders fetched",
      count: orders.length,
      data: orders
    });
  }
  catch(error){
    res.status(500).json({
      success: false,
      message: "server error",
      error: error.message
    });
  }
};

// ORDER STATUS UPDATE
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {status} = req.body;

    // valid status check
    const validStatus = ["pending", "completed", "cancelled"];

    if(!validStatus.includes(status)){
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    // /find order
    const order = await Order.findById(id);

    if(!order){
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // update status
    order.status = status;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated",
      order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "server error",
      error: error.message
    });
  }
};