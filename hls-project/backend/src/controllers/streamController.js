const path = require("path");
const fs = require("fs");

const { analyzeStream } = require("../services/streamAnalysisService");
const Stream = require("../models/Stream");
const { generateSprite } = require("../services/spriteService");

// Add new stream
exports.addStream = async (req, res) => {
  try {
    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({ message: "Name and URL are required" });
    }

    const stream = await Stream.create({ name, url });
    res.status(201).json({ message: "Stream added successfully", stream });
  } catch (error) {
    res.status(500).json({ message: "Error adding stream", error });
  }
};

// Get all streams
exports.getStreams = async (req, res) => {
  try {
    const streams = await Stream.find();

    const formatted = streams.map(stream => ({
      _id: stream._id,
      name: stream.name,
      url: stream.url,
      lastChecked: stream.lastChecked,
      lastSpriteGenerated: stream.lastSpriteGenerated,
      sprite: `/sprites/${stream._id}/sprite.jpg`,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Error fetching streams", error });
  }
};


// Get stream health
exports.getStreamHealth = async (req, res) => {
  try {
    const streamId = req.params.id;
    const stream = await Stream.findById(streamId);
    if (!stream) return res.status(404).json({ message: "Stream not found" });

    const metrics = await analyzeStream(stream.url);

    stream.lastChecked = new Date();
    await stream.save();

    res.status(200).json({
      message: "Stream health fetched successfully",
      metrics,
    });
  } catch (error) {
    console.error("Error fetching stream health:", error);
    res.status(500).json({ message: "Error analyzing stream", error });
  }
};

// Generate sprite
exports.generateSpriteForStream = async (req, res) => {
  try {
    const streamId = req.params.id;
    const stream = await Stream.findById(streamId);

    if (!stream) return res.status(404).json({ message: "Stream not found" });

    const spriteDir = path.join(__dirname, "..", "..", "public", "sprites", streamId);

    fs.mkdirSync(spriteDir, { recursive: true });

    await generateSprite(stream.url, spriteDir);

    stream.lastSpriteGenerated = new Date();
    await stream.save();

    res.status(200).json({
      message: "Sprite generated successfully",
      sprite: `/sprites/${streamId}/sprite.jpg`,
    });
  } catch (err) {
    console.error("Sprite error:", err);
    res.status(500).json({
      message: "Error generating sprite",
      error: err.toString(),
    });
  }
};
