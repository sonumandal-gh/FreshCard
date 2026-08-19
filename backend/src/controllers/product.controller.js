const Product = require("../models/product.model");
const { uploadToCloudinary } = require("../services/cloudinary.service");
const fs = require("fs");
const path = require("path");

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
          console.warn("Cloudinary Upload failed, trying local upload fallback:", uploadError.message);
        }
      }

      // Local fallback if Cloudinary not available or failed
      if (!imageUrl) {
        try {
          const uploadDir = path.join(__dirname, "../../uploads");
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const fileExtension = path.extname(req.file.originalname) || ".jpg";
          const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
          const filePath = path.join(uploadDir, uniqueFilename);
          
          await fs.promises.writeFile(filePath, req.file.buffer);
          
          const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
          imageUrl = `${baseUrl}/uploads/${uniqueFilename}`;
          console.log("Local image saved at:", imageUrl);
        } catch (localError) {
          console.error("Local file save failed:", localError);
        }
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
    const { name, price, category, stock } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    let imageUrl = product.image;

    if (req.file) {
      if (process.env.CLOUD_NAME && process.env.API_KEY && process.env.API_SECRET) {
        try {
          const result = await uploadToCloudinary(req.file.buffer);
          imageUrl = result.secure_url;
        } catch (uploadError) {
          console.warn("Cloudinary Upload failed, trying local upload fallback:", uploadError.message);
        }
      }

      // Local fallback if Cloudinary not available or failed
      if (!imageUrl || imageUrl === product.image) {
        try {
          const uploadDir = path.join(__dirname, "../../uploads");
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          const fileExtension = path.extname(req.file.originalname) || ".jpg";
          const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;
          const filePath = path.join(uploadDir, uniqueFilename);
          
          await fs.promises.writeFile(filePath, req.file.buffer);
          
          const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get("host")}`;
          imageUrl = `${baseUrl}/uploads/${uniqueFilename}`;
          console.log("Local image saved at during update:", imageUrl);
        } catch (localError) {
          console.error("Local file save failed during update:", localError);
        }
      }
    }

    product.name = name !== undefined ? name : product.name;
    product.price = price !== undefined ? Number(price) : product.price;
    product.category = category !== undefined ? category : product.category;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    product.image = imageUrl;

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during product update",
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