const express = require("express");
const router = express.Router();

const { createOrder, getOrders , updateOrderStatus} = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const adminMiddleware = require("../middlewares/admin.middleware");

// Protected
router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware ,getOrders);
router.put("/:id/status", authMiddleware, updateOrderStatus);
router.put("/:id/status", authMiddleware, adminMiddleware, updateOrderStatus)

module.exports = router;