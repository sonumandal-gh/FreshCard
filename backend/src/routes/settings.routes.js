const express = require("express");
const router = express.Router();
const Settings = require("../models/settings.model");

// GET /api/settings - Fetch current store delivery settings
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        freeDeliveryThreshold: 299,
        standardDeliveryCharge: 35,
        deliveryTimeText: "15-30 Mins",
        isFreeDeliveryEnabled: true
      });
    }
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return res.status(500).json({ success: false, message: "Error fetching settings" });
  }
});

// PUT /api/settings - Update store delivery settings
router.put("/", async (req, res) => {
  try {
    const { freeDeliveryThreshold, standardDeliveryCharge, deliveryTimeText, isFreeDeliveryEnabled } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (freeDeliveryThreshold !== undefined) {
      settings.freeDeliveryThreshold = Number(freeDeliveryThreshold) || 0;
    }
    if (standardDeliveryCharge !== undefined) {
      settings.standardDeliveryCharge = Number(standardDeliveryCharge) || 0;
    }
    if (deliveryTimeText !== undefined) {
      settings.deliveryTimeText = deliveryTimeText || "15-30 Mins";
    }
    if (isFreeDeliveryEnabled !== undefined) {
      settings.isFreeDeliveryEnabled = Boolean(isFreeDeliveryEnabled);
    }

    await settings.save();
    return res.status(200).json({
      success: true,
      message: "Delivery settings updated successfully",
      settings
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return res.status(500).json({ success: false, message: "Error updating settings" });
  }
});

module.exports = router;
