const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

// middleware
app.use(express.json());

// routes import
const userRoutes = require("./src/routes/user.routes");
const productRoutes = require("./src/routes/product.routes");
const orderRoutes = require("./src/routes/order.routes");
const paymentRoutes = require("./src/routes/payment.routes");

// MongoDB connection 
mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("DB error: ", err));

// test Router 
app.get("/", (req, res) => {
  res.send("Server running");
}) ;

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