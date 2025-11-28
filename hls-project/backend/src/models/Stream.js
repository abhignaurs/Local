const mongoose = require("mongoose");

const streamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastChecked: { type: Date }
});

module.exports = mongoose.model("Stream", streamSchema);
