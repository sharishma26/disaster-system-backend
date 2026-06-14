const mongoose = require("mongoose");

const IncidentSchema = new mongoose.Schema({
  title: String,
  type: String,
  location: {
    lat: Number,
    lng: Number
  }
});

// ✅ IMPORTANT FIX
module.exports =
  mongoose.models.Incident || mongoose.model("Incident", IncidentSchema);