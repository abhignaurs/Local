const express = require("express");
require("dotenv").config();
const path = require("path");
const connectDB = require("./src/config/db");

const streamRoutes = require('./streamRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require("cors")());

app.get("/debug/routes", (req, res) => {
  res.json(app._router.stack.map(r => ({
    path: r.route?.path,
    method: r.route?.methods
  })));
});

// ✅ Health route (working)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "hls-backend", time: new Date().toISOString() });
});

// ✅ Serve sprites from backend/public (working static serving)
app.use("/sprites", express.static(path.join(__dirname, "public")));

// ✅ Mount stream routes so frontend list/add/delete continues working
app.use("/api/streams", streamRoutes);

app.use("/api/streams", streamRoutes); // existing route stays intact

// Connect DB
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
