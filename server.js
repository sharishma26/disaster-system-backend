const express = require("express");

const cors = require("cors");

const mongoose = require("mongoose");

const multer = require("multer");

const path = require("path");

const nodemailer = require("nodemailer");

const app = express();

const axios = require("axios");

const http = require("http");

const server = http.createServer(app);

const { Server } = require("socket.io");

//const io = new Server(server, {
  //cors: {
    //origin: "*"
 // }
//});

const bcrypt = require("bcryptjs");

const jwt = require("jsonwebtoken");

require("dotenv").config();

const JWT_SECRET = "disaster_secret_key";

const PDFDocument = require("pdfkit");

/* =========================
   MIDDLEWARE
========================= */

app.use(cors({ origin: "*" }));

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

/* =========================
   STATIC UPLOADS
========================= */

app.use(
  "/uploads",
  express.static("uploads")
);
const fs = require("fs");

if(!fs.existsSync("uploads")){

  fs.mkdirSync(

    "uploads",

    { recursive: true }
  );
}
/* =========================
   MULTER STORAGE
========================= */

const storage = multer.diskStorage({

  destination: function(req, file, cb){

    cb(null, "uploads/");
  },

  filename: function(req, file, cb){

    cb(

      null,

      Date.now() +

      path.extname(file.originalname)
    );
  }
});

const upload = multer({

  storage: storage
});

/* =========================
   MONGODB CONNECTION
========================= */

const uri =
  "mongodb://sharishma:sk263105@ac-j3bpbi7-shard-00-00.sdzqe5e.mongodb.net:27017,ac-j3bpbi7-shard-00-01.sdzqe5e.mongodb.net:27017,ac-j3bpbi7-shard-00-02.sdzqe5e.mongodb.net:27017/disaster?ssl=true&replicaSet=atlas-oqiwbw-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(uri)

.then(() => {

  console.log(
    "✅ MongoDB Connected Successfully"
  );
})

.catch((err) => {

  console.log(
    "❌ MongoDB Error:",
    err.message
  );
});

/* =========================
   EMAIL CONFIGURATION
========================= */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
transporter.verify((error, success) => {

  if(error){

    console.log("SMTP ERROR:", error);

  }

  else{

    console.log("SMTP READY");

  }

});
const userSchema = new mongoose.Schema({

  username: String,

  email: String,

  password: String,

  otp: String,

  verified: {

    type: Boolean,

    default: false
  }
});

const User = mongoose.model(

  "User",

  userSchema
);

const rescueTeamSchema = new mongoose.Schema({

  teamName: String,

  members: Number,

  vehicle: String,

  status: {

    type: String,

    default: "Available"

  },

  latitude: Number,

  longitude: Number

});

const RescueTeam = mongoose.model(
  "RescueTeam",
  rescueTeamSchema
);

const sosSchema = new mongoose.Schema({

  name: String,

  location: String,

  latitude: Number,

  longitude: Number,

  status: {

    type: String,

    default: "Emergency"

  },

  createdAt: {

    type: Date,

    default: Date.now

  }

});

const SOS = mongoose.model(
  "SOS",
  sosSchema
);

const rescueSchema = new mongoose.Schema({

  location: String,

  status: {
    type: String,
    default: "Pending"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

const Rescue = mongoose.model(
  "Rescue",
  rescueSchema
);
/* =========================
   INCIDENT SCHEMA
========================= */

const incidentSchema =

  new mongoose.Schema({

    disasterType: String,

    severity: String,

    location: String,

    description: String,

    latitude: Number,

    longitude: Number,

    image: String,

    status: {

      type: String,

      default: "Pending"
    },

    createdAt: {

      type: Date,

      default: Date.now
    }

  });

/* =========================
   MODEL
========================= */

const Incident =

  mongoose.model(
    "Incident",
    incidentSchema
  );

/* =========================
   HOME ROUTE
========================= */

app.get("/", (req, res) => {

  res.send(
    "🚀 Disaster API Running"
  );
});

/* =========================
   TEST ROUTE
========================= */

app.get("/test", (req, res) => {

  res.send(
    "✅ API Working Successfully"
  );
});

/* =========================
   CREATE INCIDENT
========================= */

app.post(

  "/report",

  upload.single("image"),

  async (req, res) => {

    try{

      const incident =

        new Incident({

          disasterType:
            req.body.disasterType,

          severity:
            req.body.severity,

          location:
            req.body.location,

          description:
            req.body.description,

            latitude:
              req.body.latitude,

             longitude:
                 req.body.longitude,

          image:
            req.file
              ? req.file.filename
              : "default.png",

          status: "Pending"
        });

      await incident.save();

      console.log("✅ Incident Saved");

      //io.emit(
  //"newIncident",
  //incident
//);

      /* =========================
         EMAIL ALERT
      ========================= */

      if(req.body.severity === "High"){

        const mailOptions = {

          from:
            "chukkasharishma1@gmail.com",

          to:
            "chukkasharishma1@gmail.com",

          subject:
            "🚨 HIGH DISASTER ALERT",

          html: `

          <h2>
            🚨 HIGH DISASTER ALERT
          </h2>

          <p>
            <b>Disaster Type:</b>
            ${req.body.disasterType}
          </p>

          <p>
            <b>Severity:</b>
            ${req.body.severity}
          </p>

          <p>
            <b>Location:</b>
            ${req.body.location}
          </p>

          <p>
            <b>Description:</b>
            ${req.body.description}
          </p>

          <p style="color:red;">
            Immediate action required.
          </p>
          `
        };

        transporter.sendMail(

          mailOptions,

          function(error, info){

            if(error){

              console.log(
                "❌ Email Error:",
                error
              );
            }

            else{

              console.log(

                "✅ Email Sent:",

                info.response
              );
            }
          }
        );
      }

      res.json({

        success: true,

        message:
          "✅ Incident Reported Successfully",

        incident
      });

    }

    catch(err){

      res.status(500).json({

        success: false,

        error: err.message
      });
    }

  }
);

/* =========================
   GET ALL INCIDENTS
========================= */

app.get(

  "/incidents",

  async (req, res) => {

    try{

      const data =

        await Incident.find()

        .sort({

          createdAt: -1
        });

      res.json(data);

    }

    catch(err){

      res.status(500).json({

        error: err.message
      });
    }

  }
);

/* =========================
   SEARCH INCIDENTS
========================= */

app.get(

  "/search/:keyword",

  async (req, res) => {

    try{

      const keyword =
        req.params.keyword;

      const results =

        await Incident.find({

          $or: [

            {

              disasterType: {

                $regex: keyword,

                $options: "i"
              }
            },

            {

              location: {

                $regex: keyword,

                $options: "i"
              }
            },

            {

              severity: {

                $regex: keyword,

                $options: "i"
              }
            }

          ]

        });

      res.json(results);

    }

    catch(err){

      res.status(500).json({

        error: err.message
      });
    }

  }
);

/* =========================
   UPDATE INCIDENT STATUS
========================= */

app.put(

  "/incident/:id",

  async (req, res) => {

    try{

      await Incident.findByIdAndUpdate(

        req.params.id,

        {

          status:
            req.body.status
        }
      );

      res.json({

        message:
          "✅ Status Updated Successfully"
      });

    }

    catch(err){

      res.status(500).json({

        error: err.message
      });
    }

  }
);

/* =========================
   DELETE INCIDENT
========================= */

app.delete(

  "/incident/:id",

  async (req, res) => {

    try{

      await Incident.findByIdAndDelete(

        req.params.id
      );

      res.json({

        message:
          "🗑️ Incident Deleted Successfully"
      });

    }

    catch(err){

      res.status(500).json({

        error: err.message
      });
    }

  }
);

/* =========================
   GET HIGH SEVERITY REPORTS
========================= */

app.get(

  "/high-alerts",

  async (req, res) => {

    try{

      const highAlerts =

        await Incident.find({

          severity: "High"
        })

        .sort({

          createdAt: -1
        });

      res.json(highAlerts);

    }

    catch(err){

      res.status(500).json({

        error: err.message
      });
    }

  }
);
app.get("/send-test-email", async (req, res) => {

  try {

    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS EXISTS:", !!process.env.EMAIL_PASS);

    await transporter.sendMail({

      from: process.env.EMAIL_USER,

      to: process.env.EMAIL_USER,

      subject: "✅ Test Email",

      text: "Nodemailer is working successfully"

    });

    res.send("✅ Test Email Sent");

  }

  catch(error){

    console.log("EMAIL ERROR:", error);

    res.send(error.message);

  }

});

app.post("/register", async (req, res) => {

  try {

    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {

      return res.json({
        success: false,
        message: "User already exists"
      });

    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = new User({

      username,
      email,
      password: hashedPassword,
      otp,
      verified: false

    });

    await user.save();

    console.log("User Registered Successfully");

    console.log("Generated OTP:", otp);

    console.log("Sending OTP to:", email);

    //const info = await transporter.sendMail({

     // from: process.env.EMAIL_USER,

      //to: email,

      //subject: "OTP Verification",

      //text: `Your OTP is ${otp}`

    //});

    //console.log("Email Sent:", info.response);

    res.json({

      success: true,

      message: "✅ Registration Successful"

    });

  }

  catch (error) {

    console.log("REGISTER ERROR:", error);

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});

/* =========================
   LOGIN API
========================= */
app.post("/verify-otp", async (req, res) => {

  try{

    const {

      email,

      otp

    } = req.body;

    const user = await User.findOne({

      email
    });

    if(!user){

      return res.json({

        success:false,

        message:"User Not Found"
      });
    }
        console.log("Database OTP:", user.otp);
    console.log("Entered OTP:", otp);
    console.log("Email:", email);

    if(user.otp.trim() !== otp.trim()){

      return res.json({
        success:false,
        message:"Invalid OTP"
      });
    }

    user.verified = true;

    user.otp = "";

    await user.save();

    res.json({

      success:true,

      message:"✅ Account Verified Successfully"
    });

  }

  catch(error){

    res.status(500).json({

      success:false,

      error:error.message
    });
  }
});

app.post("/login", async (req, res) => {

  try {

    const {

      email,

      password

    } = req.body;

    const user = await User.findOne({

      email
    });

    if(!user){

      return res.json({

        success: false,

        message: "User Not Found"
      });
    }
    if(!user.verified){

  return res.json({

    success:false,

    message:"Please Verify OTP First"
  });
}

    const isMatch = await bcrypt.compare(

      password,

      user.password
    );

    if(!isMatch){

      return res.json({

        success: false,

        message: "Wrong Password"
      });
    }

    const token = jwt.sign(

      {

        id: user._id
      },

      JWT_SECRET
    );

    res.json({

      success: true,

      message: "Login Successful",

      token
    });

  }

  catch(err){

    res.status(500).json({

      success: false,

      error: err.message
    });
  }
});

app.post(

  "/forgot-password",

  async (req, res) => {

    try {

      const { email } = req.body;

      const user = await User.findOne({

        email
      });

      if(!user){

        return res.json({

          success:false,

          message:"User Not Found"
        });
      }

      await transporter.sendMail({

        from: process.env.EMAIL_USER,

        to: email,

        subject:
          "Password Reset",

        text:
          "Your password reset request was received."
      });

      res.json({

        success:true,

        message:
          "✅ Reset Email Sent"
      });

    }

    catch(error){

      res.status(500).json({

        success:false,

        error:error.message
      });
    }
});
app.post("/reset-password", async (req,res)=>{

  try{

    const { email,password } = req.body;

    const user = await User.findOne({ email });

    if(!user){

      return res.json({

        success:false,

        message:"User Not Found"
      });
    }

    const hashedPassword = await bcrypt.hash(

      password,

      10
    );

    user.password = hashedPassword;

    await user.save();

    res.json({

      success:true,

      message:"✅ Password Updated Successfully"
    });

  }

  catch(error){

    res.status(500).json({

      success:false,

      error:error.message
    });
  }

});

app.get("/stats", async (req, res) => {

  try{

    const total =
      await Incident.countDocuments();

    const pending =
      await Incident.countDocuments({
        status: "Pending"
      });

    const resolved =
      await Incident.countDocuments({
        status: "Resolved"
      });

    const high =
      await Incident.countDocuments({
        severity: "High"
      });

    res.json({

      total,
      pending,
      resolved,
      high

    });

  }

  catch(error){

    res.status(500).json({

      error:error.message
    });
  }

});

app.get("/download-report", async (req, res) => {

  const incidents = await Incident.find();

  const doc = new PDFDocument();

  res.setHeader(
    "Content-Type",
    "application/pdf"
  );

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=Disaster_Report.pdf"
  );

  doc.pipe(res);

  doc.fontSize(20)
     .text("Disaster Incident Report");

  doc.moveDown();

  incidents.forEach((incident,index)=>{

    doc.fontSize(12)
       .text(`${index+1}. ${incident.disasterType}`);

    doc.text(
      `Location: ${incident.location}`
    );

    doc.text(
      `Severity: ${incident.severity}`
    );

    doc.text(
      `Status: ${incident.status}`
    );

    doc.text(
      `Description: ${incident.description}`
    );

    doc.moveDown();
  });

  doc.end();

});

/* =========================
   GET ALL RESCUE TEAMS
========================= */

app.get("/teams", async (req, res) => {

  try {

    const teams =
      await RescueTeam.find();

    res.json(teams);

  }

  catch(error){

    res.status(500).json({

      error: error.message

    });

  }

});

app.put(

  "/assign-team/:id",

  async (req, res) => {

    try{

      await RescueTeam.findByIdAndUpdate(

        req.params.id,

        {

          status: "Assigned"

        }

      );

      res.json({

        message: "🚑 Team Assigned"

      });

    }

    catch(error){

      res.status(500).json({

        error: error.message

      });

    }

});
app.post("/sos", async (req, res) => {

  try{

    const sos = new SOS({

      name: req.body.name,

      location: req.body.location,

      latitude: req.body.latitude,

      longitude: req.body.longitude

    });

    await sos.save();

    //io.emit("sosAlert", sos);

    res.json({

      success: true,

      message: "🚨 SOS Sent Successfully"

    });

  }

  catch(error){

    res.status(500).json({

      error: error.message

    });

  }

});
app.post("/rescue", async(req,res)=>{

  try{

    const rescue = new Rescue({

      location:req.body.location
    });

    await rescue.save();

    res.json({

      success:true,

      message:"🚁 Rescue Request Sent"
    });

  }

  catch(error){

    res.status(500).json({

      error:error.message
    });
  }
});
app.get("/rescues", async(req,res)=>{

  const data = await Rescue.find()

  .sort({

    createdAt:-1
  });

  res.json(data);
});
app.get("/sos-alerts", async (req,res)=>{

  try{

    const alerts = await SOS.find()

    .sort({
      createdAt:-1
    });

    res.json(alerts);

  }

  catch(error){

    res.status(500).json({

      error:error.message
    });
  }

});

app.get("/news", async (req, res) => {

  try {

    const response = await axios.get(
      "https://newsapi.org/v2/everything?q=disaster OR flood OR cyclone&language=en&apiKey=d978223f6137414d97b3798b6f7ed9a8"
    );

    res.json(response.data);

  }

  catch(error){

    res.status(500).json({

      error: error.message

    });

  }

});

app.get("/add-all-teams", async (req, res) => {

  try {

  const teams = [

{ teamName:"Andhra Pradesh Rescue Team", members:12, vehicle:"Ambulance", status:"Available", latitude:15.9129, longitude:79.7400 },

{ teamName:"Arunachal Pradesh Rescue Team", members:10, vehicle:"Rescue Van", status:"Available", latitude:28.2180, longitude:94.7278 },

{ teamName:"Assam Rescue Team", members:12, vehicle:"Ambulance", status:"Available", latitude:26.2006, longitude:92.9376 },

{ teamName:"Bihar Rescue Team", members:12, vehicle:"Ambulance", status:"Available", latitude:25.0961, longitude:85.3131 },

{ teamName:"Chhattisgarh Rescue Team", members:10, vehicle:"Fire Truck", status:"Available", latitude:21.2787, longitude:81.8661 },

{ teamName:"Goa Rescue Team", members:8, vehicle:"Rescue Van", status:"Available", latitude:15.2993, longitude:74.1240 },

{ teamName:"Gujarat Rescue Team", members:14, vehicle:"Ambulance", status:"Available", latitude:22.2587, longitude:71.1924 },

{ teamName:"Haryana Rescue Team", members:10, vehicle:"Rescue Van", status:"Available", latitude:29.0588, longitude:76.0856 },

{ teamName:"Himachal Pradesh Rescue Team", members:10, vehicle:"Mountain Rescue", status:"Available", latitude:31.1048, longitude:77.1734 },

{ teamName:"Jharkhand Rescue Team", members:10, vehicle:"Ambulance", status:"Available", latitude:23.6102, longitude:85.2799 },

{ teamName:"Karnataka Rescue Team", members:14, vehicle:"Fire Truck", status:"Available", latitude:15.3173, longitude:75.7139 },

{ teamName:"Kerala Rescue Team", members:12, vehicle:"Ambulance", status:"Available", latitude:10.8505, longitude:76.2711 },

{ teamName:"Madhya Pradesh Rescue Team", members:12, vehicle:"Rescue Van", status:"Available", latitude:22.9734, longitude:78.6569 },

{ teamName:"Maharashtra Rescue Team", members:15, vehicle:"Ambulance", status:"Available", latitude:19.7515, longitude:75.7139 },

{ teamName:"Manipur Rescue Team", members:10, vehicle:"Rescue Van", status:"Available", latitude:24.6637, longitude:93.9063 },

{ teamName:"Meghalaya Rescue Team", members:10, vehicle:"Rescue Van", status:"Available", latitude:25.4670, longitude:91.3662 },

{ teamName:"Mizoram Rescue Team", members:10, vehicle:"Ambulance", status:"Available", latitude:23.1645, longitude:92.9376 },

{ teamName:"Nagaland Rescue Team", members:10, vehicle:"Rescue Van", status:"Available", latitude:26.1584, longitude:94.5624 },

{ teamName:"Odisha Rescue Team", members:12, vehicle:"Cyclone Vehicle", status:"Available", latitude:20.9517, longitude:85.0985 },

{ teamName:"Punjab Rescue Team", members:10, vehicle:"Fire Truck", status:"Available", latitude:31.1471, longitude:75.3412 },

{ teamName:"Rajasthan Rescue Team", members:12, vehicle:"Rescue Van", status:"Available", latitude:27.0238, longitude:74.2179 },

{ teamName:"Sikkim Rescue Team", members:8, vehicle:"Mountain Rescue", status:"Available", latitude:27.5330, longitude:88.5122 },

{ teamName:"Tamil Nadu Rescue Team", members:14, vehicle:"Ambulance", status:"Available", latitude:11.1271, longitude:78.6569 },

{ teamName:"Telangana Rescue Team", members:12, vehicle:"Rescue Van", status:"Available", latitude:18.1124, longitude:79.0193 },

{ teamName:"Tripura Rescue Team", members:8, vehicle:"Rescue Van", status:"Available", latitude:23.9408, longitude:91.9882 },

{ teamName:"Uttar Pradesh Rescue Team", members:15, vehicle:"Ambulance", status:"Available", latitude:26.8467, longitude:80.9462 },

{ teamName:"Uttarakhand Rescue Team", members:10, vehicle:"Mountain Rescue", status:"Available", latitude:30.0668, longitude:79.0193 },

{ teamName:"West Bengal Rescue Team", members:12, vehicle:"Cyclone Vehicle", status:"Available", latitude:22.9868, longitude:87.8550 }

];

    await RescueTeam.insertMany(teams);

    res.send("✅ All State Rescue Teams Added Successfully");

  } catch (error) {

    res.status(500).send(error.message);

  }

});
/* =========================
   SERVER
========================= */

const PORT = 5000;

server.listen(PORT, () => {

  console.log(
    `🚀 Server running on port ${PORT}`
  );

});