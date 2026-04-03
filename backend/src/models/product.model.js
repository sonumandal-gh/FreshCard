const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true
  },

  price: {
    type: Number,
    require: true
  },

  category: {
    type: String,
    require: true
  },

  stock: {
    type: Number,
    require: true
  },

  image: {
    type: String
  }
  
},{timestamps: true});

module.exports = mongoose.model("Product", productSchema);