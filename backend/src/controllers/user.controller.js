const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

// REGISTER
exports.registerUser = async (req , res) => {
  try {
    const {name, email ,password} = req.body;

    // basic validation
    if(!name || !email || !password){
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    // user already exist check
    const existingUser = await User.findOne({email});
    if(existingUser){
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
      password: hashedPassword
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

// LOGIN
exports.loginUser = async (req, res) => {
  try{
    const {email , password} = req.body;

    // validation
    if(!email || !password){
      return res.status(400).json({
        message: "Email and password require"
      });
    }

    // find user
    const user = await User.findOne({email});
    if(!user){
      return res.status(400).json({
        message: "User not found"
      });
    }

    // compare password 
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    // generate token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login Successful",
      token
    });
  }
  
  catch(error){
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};