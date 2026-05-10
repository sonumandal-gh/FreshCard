const express = require("express");
const passport = require("passport");
const Router = express.Router();

Router.get("/test", (req, res) => res.send("User Router is working!"));

const { registerUser, loginUser, logoutUser, refreshAccessToken, googleAuthCallback, getAllUsers, updateUserRole } = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

// protected route
Router.get("/profile", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

Router.post("/register", registerUser);
Router.post("/login", loginUser);
Router.post("/logout", authMiddleware, logoutUser);
Router.post("/refresh-token", refreshAccessToken);

// Admin only routes
Router.get("/all", authMiddleware, adminMiddleware, getAllUsers);
Router.put("/:id/role", authMiddleware, adminMiddleware, updateUserRole);

// Google OAuth routes
Router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

Router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  googleAuthCallback
);

module.exports = Router;