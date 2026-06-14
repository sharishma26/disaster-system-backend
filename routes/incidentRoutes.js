const express = require("express");
const router = express.Router();
const Incident = require("../models/Incident");

// Add incident
router.post("/", async (req, res) => {
  const data = await Incident.create(req.body);
  res.json(data);
});

// Get incidents
router.get("/", async (req, res) => {
  const data = await Incident.find();
  res.json(data);
});

module.exports = router;