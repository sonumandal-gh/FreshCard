const Product = require("../models/product.model");
const { uploadToCloudinary } = require("../services/cloudinary.service");

//  Add Product
exports.createProduct = async (req, res) => {
  try {
    console.log("Create Product Request Body:", req.body);
    console.log("Create Product Request File:", req.file);
    
    const { name, price, category, stock } = req.body;

    if (!name || !price || !category || !stock) {
      console.warn("Missing required fields:", { name, price, category, stock });
      return res.status(400).json({
        success: false,
        message: "All fields (name, price, category, stock) are required"
      });
    }

    let imageUrl = "";

    if (req.file) {
      if (process.env.CLOUD_NAME && process.env.API_KEY && process.env.API_SECRET) {
        try {
          const result = await uploadToCloudinary(req.file.buffer);
          imageUrl = result.secure_url;
        } catch (uploadError) {
          console.warn("Cloudinary Upload failed, proceeding without image:", uploadError.message);
          // We can choose to continue or fail. For now, let's continue so the product is created.
        }
      } else {
        console.warn("Cloudinary credentials missing in .env. Skipping upload.");
      }
    }

    const product = await Product.create({
      name,
      price: Number(price),
      category,
      stock: Number(stock),
      image: imageUrl
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product
    });

  } catch (error) {
    console.error("Product Creation Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during product creation",
      error: error.message || error
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