const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: function() { return !this.googleId; }, // password is required only if googleId is not present
      minlength: 6
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true // allow multiple nulls
    },
    role: {
      type: String, 
      enum: ["user", "admin", "seller"],
      default: "user"
    },
    refreshToken: {
      type: String
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);