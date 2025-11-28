const express = require("express");
const router = express.Router();

const { 
  addStream, 
  getStreams, 
  getStreamHealth,
  generateSpriteForStream 
} = require("../controllers/streamController");

router.post("/add", addStream);

router.get("/", getStreams);

router.get("/:id/health", getStreamHealth);

router.get("/:id/sprite", generateSpriteForStream);

module.exports = router;
