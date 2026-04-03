const User = require("../models/user.model");

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admin only"
      });
    }

    next();

  } catch (error) {
    res.status(500).json({
      message: "server error",
      error: error.message
    });
  }
};

module.exports = adminMiddleware;