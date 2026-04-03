const Product = require("../models/product.model");
const { uploadToCloudinary } = require("../services/cloudinary.service");

//  Add Product
exports.createProduct = async (req, res) => {
  try {
    const { name, price, category, stock } = req.body;

    let imageUrl = "";

    if(req.file){
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const product = await Product.create({
      name,
      price,
      category,
      stock
    });

    res.status(201).json({
      message: "Product created",
      product
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error
    });
  }
};

//  Get All Products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json({
      count: products.length,
      products
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

//  Update Product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );

    // 🔥 not found check
    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json({
      message: "Product updated",
      product: updatedProduct
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

//  Delete Product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    // 🔥 not found check
    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.status(200).json({
      message: "Product deleted"
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};