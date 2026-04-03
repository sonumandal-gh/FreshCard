const express = require("express");
const Router = express.Router();

const {registerUser, loginUser} = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// protected route
Router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

Router.post("/register", registerUser);
Router.post("/login", loginUser);

module.exports = Router;