const express = require('express');
const cors = require('cors');
const path = require("path");
const streamRoutes = require('./streamRoutes');


const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve all static files from backend/public under /sprites
app.use("/sprites", express.static(path.join(__dirname, "..", "public")));

// ✅ Working health endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'hls-backend',
    timestamp: new Date().toISOString(),
  });
});

// Routes for streams
app.use("/api/streams", streamRoutes);

// Root test
app.get("/", (req, res) => {
  res.send("HLS Monitoring Backend Active");
});

module.exports = app;
