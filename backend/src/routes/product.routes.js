const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct
} = require("../controllers/product.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// Protected routes
router.post("/",authMiddleware,upload.single("image"), createProduct);
router.put("/:id", authMiddleware,upload.single("image"), updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);

// public routes
router.get("/", getProducts);

module.exports = router;