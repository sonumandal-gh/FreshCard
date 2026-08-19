const Category = require("../models/category.model");
const Product = require("../models/product.model");

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    let categories = await Category.find().sort({ name: 1 });
    if (categories.length === 0) {
      // Auto-populate default categories
      const defaults = ['Vegetables', 'Fruits', 'Dairy', 'Snacks', 'Beverages'];
      await Category.insertMany(defaults.map(name => ({ name })));
      categories = await Category.find().sort({ name: 1 });
    }
    res.status(200).json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching categories",
      error: error.message
    });
  }
};

// Create a category (Admin only)
exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required"
      });
    }

    // Check if category already exists
    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, "i") } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category already exists"
      });
    }

    const category = await Category.create({ name: name.trim() });
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while creating category",
      error: error.message
    });
  }
};

// Update a category (Admin only)
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required"
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    const oldName = category.name;
    const newName = name.trim();

    // Check duplicate
    const existing = await Category.findOne({ 
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${newName}$`, "i") }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Another category with this name already exists"
      });
    }

    category.name = newName;
    await category.save();

    // Sync products category string if it matches old name
    if (oldName !== newName) {
      await Product.updateMany({ category: oldName }, { category: newName });
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while updating category",
      error: error.message
    });
  }
};

// Delete a category (Admin only)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found"
      });
    }

    await Category.findByIdAndDelete(id);

    // Set products that have this category to "Uncategorized" so they don't get orphaned
    await Product.updateMany({ category: category.name }, { category: "Uncategorized" });

    res.status(200).json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting category",
      error: error.message
    });
  }
};
