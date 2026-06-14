const express = require("express");

const router = express.Router();

const bcrypt = require("bcryptjs");

const nodemailer = require("nodemailer");

const User = require("../models/User");

/* =========================
   EMAIL CONFIGURATION
========================= */

const transporter = nodemailer.createTransport({

  service: "gmail",

  auth: {

    user: "chukkasharishma1@gmail.com",

    pass: "kkwa wezl vreh axhw"

  }

});

/* =========================
   GENERATE OTP
========================= */

function generateOTP(){

  return Math.floor(

    100000 + Math.random() * 900000

  ).toString();

}

/* =========================
   REGISTER
========================= */

router.post("/register", async (req, res) => {

  try{

    const {

      name,

      email,

      password

    } = req.body;

    const existingUser =

      await User.findOne({ email });

    if(existingUser){

      return res.json({

        message: "User already exists"

      });

    }

    const hashedPassword =

      await bcrypt.hash(password, 10);

    const otp = generateOTP();

    const user = new User({

      name,

      email,

      password: hashedPassword,

      otp,

      verified: false

    });

    await user.save();

    await transporter.sendMail({

      from: "chukkasharishma1@gmail.com",

      to: email,

      subject: "Disaster System OTP Verification",

      text: `Your OTP is ${otp}`

    });

    res.json({

      message: "OTP Sent Successfully"

    });

  }

  catch(error){

    res.status(500).json({

      error: error.message

    });

  }

});

/* =========================
   VERIFY OTP
========================= */

router.post("/verify-otp", async (req, res) => {

  try{

    const {

      email,

      otp

    } = req.body;

    const user =

      await User.findOne({ email });

    if(!user){

      return res.json({

        message: "User not found"

      });

    }

    if(user.otp !== otp){

      return res.json({

        message: "Invalid OTP"

      });

    }

    user.verified = true;

    user.otp = "";

    await user.save();

    res.json({

      message: "Account Verified Successfully"

    });

  }

  catch(error){

    res.status(500).json({

      error: error.message

    });

  }

});

/* =========================
   LOGIN
========================= */

router.post("/login", async (req, res) => {

  try{

    const {

      email,

      password

    } = req.body;

    const user =

      await User.findOne({ email });

    if(!user){

      return res.json({

        message: "User not found"

      });

    }

    if(!user.verified){

      return res.json({

        message: "Please verify OTP first"

      });

    }

    const isMatch =

      await bcrypt.compare(

        password,

        user.password

      );

    if(!isMatch){

      return res.json({

        message: "Invalid Password"

      });

    }

    res.json({

      message: "Login Successful"

    });

  }

  catch(error){

    res.status(500).json({

      error: error.message

    });

  }

});

/* =========================
   FORGOT PASSWORD
========================= */

router.post("/forgot-password", async (req, res) => {

  try{

    const { email } = req.body;

    const user =

      await User.findOne({ email });

    if(!user){

      return res.json({

        message: "User not found"

      });

    }

    const resetOTP = generateOTP();

    user.otp = resetOTP;

    await user.save();

    await transporter.sendMail({

      from: "chukkasharishma1@gmail.com",

      to: email,

      subject: "Password Reset OTP",

      text: `Your Password Reset OTP is ${resetOTP}`

    });

    res.json({

      message: "Reset OTP Sent Successfully"

    });

  }

  catch(error){

    res.status(500).json({

      error: error.message

    });

  }

});

/* =========================
   RESET PASSWORD
========================= */

router.post("/reset-password", async (req, res) => {

  try{

    const {

      email,

      otp,

      newPassword

    } = req.body;

    const user =

      await User.findOne({ email });

    if(!user){

      return res.json({

        message: "User not found"

      });

    }
    console.log("Stored OTP:", user.otp);
   
    console.log("Entered OTP:", otp);

    if(user.otp !== otp){

      return res.json({

        message: "Invalid OTP"

      });

    }

    const hashedPassword =

      await bcrypt.hash(

        newPassword,

        10

      );

    user.password = hashedPassword;

    user.otp = "";

    await user.save();

    res.json({

      message: "Password Reset Successful"

    });

  }

  catch(error){

    res.status(500).json({

      error: error.message

    });

  }

});

module.exports = router;