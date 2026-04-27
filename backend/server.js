const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require('express-session');
const passport = require("passport");
require("dotenv").config();
require("./src/config/passport"); // Register Passport Strategies

const app = express();

// middleware
app.use(express.json());
app.use(cookieParser());

// Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'mysecret',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// routes import
const userRoutes = require("./src/routes/user.routes");
const productRoutes = require("./src/routes/product.routes");
const orderRoutes = require("./src/routes/order.routes");
const paymentRoutes = require("./src/routes/payment.routes");

// MongoDB connection 
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("DB error: ", err));

app.get("/api/health", (req, res) => {
  res.send("Backend API Health: OK");
});

// routes connect
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders" , orderRoutes);
app.use("/api/payment", paymentRoutes);

// server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});