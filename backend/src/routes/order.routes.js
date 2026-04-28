const express = require("express");
const router = express.Router();

const { createOrder, getOrders , updateOrderStatus, getMyOrders} = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

// Protected
router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware ,getOrders);
router.get("/my-orders", authMiddleware, getMyOrders);
router.put("/:id/status", authMiddleware, adminMiddleware, updateOrderStatus)

module.exports = router;