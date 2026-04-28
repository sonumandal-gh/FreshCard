const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// REGISTER
exports.registerUser = async (req , res) => {
  try {
    const { name, email, password, role } = req.body;

    // basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // user already exist check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user"
    });

    res.status(201).json({
      message: "User registered succesfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  }
  catch(error){
    res.status(500).json({
      message: "server error",
      error: error.message
    });
  }
};

// REFRESH ACCESS TOKEN
exports.refreshAccessToken = async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: "Unauthorized request" });
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET || "refresh_secret"
    );

    const user = await User.findById(decodedToken?.id);

    if (!user) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      return res.status(401).json({ message: "Refresh token is expired or used" });
    }

    // Inactivity check removed to allow full 7-day session

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    };

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .json({
        message: "Access token refreshed",
        token: accessToken,
        refreshToken: newRefreshToken
      });

  } catch (error) {
    return res.status(401).json({ message: error?.message || "Invalid refresh token" });
  }
};

// LOGOUT
exports.logoutUser = async (req, res) => {
  try {
    const userId = req.user.id;
    await User.findByIdAndUpdate(
      userId,
      {
        $unset: {
          refreshToken: 1 // remove refresh token from DB
        }
      },
      {
        new: true
      }
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    };

    return res
      .status(200)
      .clearCookie("refreshToken", options)
      .json({ message: "User logged out" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// GOOGLE AUTH CALLBACK
exports.googleAuthCallback = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Authentication failed" });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    };

    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.status(200)
      .cookie("refreshToken", refreshToken, options)
      .redirect(`${frontendUrl}/auth-success?token=${accessToken}`);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to generate tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET || "refresh_secret",
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    user.lastActivity = Date.now();
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error("Error generating tokens");
  }
};

// LOGIN
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required"
      });
    }

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    // compare password 
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    // generate tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // set cookie options
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    };

    res.status(200)
      .cookie("refreshToken", refreshToken, options)
      .json({
        message: "Login Successful",
        token: accessToken,
        refreshToken // optional: many devs return it once, but roadmap says access in client, refresh in cookie
      });
  }

  catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};