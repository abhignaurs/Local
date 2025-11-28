const mongoose = require("mongoose");

const LatencySchema = new mongoose.Schema({
  streamUrl: String,
  latency: Number,
  recordedAt: Date
});

module.exports = mongoose.model("Latency", LatencySchema);
