const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    freeDeliveryThreshold: {
      type: Number,
      default: 299,
      min: 0
    },
    standardDeliveryCharge: {
      type: Number,
      default: 35,
      min: 0
    },
    deliveryTimeText: {
      type: String,
      default: "15-30 Mins"
    },
    isFreeDeliveryEnabled: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Settings", settingsSchema);
