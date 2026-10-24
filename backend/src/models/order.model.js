const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product"
        },
        quantity: {
          type: Number,
          default: 1
        }
      }
    ],
    totalPrice: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending"
    },
    paymentMethod: {
      type: String,
      default: "cod"
    },
    paymentId: {
      type: String,
      default: ""
    },
    deliveryAddress: {
      fullName: { type: String, default: "" },
      phone: { type: String, default: "" },
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      landmark: { type: String, default: "" },
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);