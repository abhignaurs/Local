const HLS = require("hls-parser");
const { exec } = require("child_process");

function ffprobe(url) {
  return new Promise((resolve, reject) => {
    const cmd = `ffprobe -v quiet -print_format json -show_entries stream=bit_rate,avg_frame_rate -show_format "${url}"`;
    exec(cmd, (err, stdout) => {
      if (err) return resolve(null); // non-fatal
      try {
        resolve(JSON.parse(stdout));
      } catch {
        resolve(null);
      }
    });
  });
}

exports.analyzeStream = async (url) => {
  try {
    // Fetch playlist
    const playlistText = await fetch(url).then((r) => r.text());
    const parsed = HLS.parse(playlistText);

    let segments = [];
    if (!parsed.isMaster && parsed.segments) {
      segments = parsed.segments;
    }

    // ---- 🔥 1. Calculate Segment Duration Stats ----
    const durations = segments.map((s) => s.duration);
    const averageDuration = durations.length ? durations.reduce((a, b) => a + b) / durations.length : null;

    // ---- 🔥 2. Estimate Latency ----
    // Simple heuristic: latency = last segment start + duration
    let latencySeconds = null;
    if (segments.length > 0) {
      const lastSeg = segments[segments.length - 1];
      latencySeconds = lastSeg.duration * (parsed.targetDuration ? segments.length / parsed.targetDuration : 1);
      latencySeconds = Number(latencySeconds.toFixed(2));
    }

    // ---- 🔥 3. Bitrate from probed stream ----
    const probeData = await ffprobe(url);
    const bitrate = probeData?.streams?.[0]?.bit_rate
      ? Number(probeData.streams[0].bit_rate)
      : null;

    // ---- 🔥 4. Playlist Error Checks ----
    const errors = [];

    if (!parsed.segments || parsed.segments.length === 0) {
      errors.push("Playlist has no segments.");
    }

    if (parsed.targetDuration && parsed.segments) {
      const maxDuration = Math.max(...durations);
      if (maxDuration > parsed.targetDuration * 1.5) {
        errors.push("Segments exceed targetDuration by > 50%.");
      }
    }

    // Missing discontinuity tags?
    const discontinuities = parsed.segments?.filter((s) => s.discontinuity).length || 0;
    if (discontinuities > 0) {
      errors.push(`Detected ${discontinuities} discontinuities in stream.`);
    }

    // ---- 🔥 5. Alerts (derived from metrics) ----
    const alerts = [];

    if (bitrate !== null && bitrate < 500000) {
      alerts.push({ type: "bitrate_low", severity: "warning", bitrate });
    }

    if (latencySeconds !== null && latencySeconds > 12) {
      alerts.push({ type: "high_latency", severity: "critical", latencySeconds });
    }

    if (errors.length > 0) {
      errors.forEach((err) =>
        alerts.push({ type: "playlist_error", severity: "critical", message: err })
      );
    }

    // ---- 🔥 FINAL RESPONSE ----
    return {
      playlistType: parsed.isMaster ? "MASTER" : "MEDIA",
      variantCount: parsed.isMaster ? parsed.variants.length : 1,
      targetDuration: parsed.targetDuration || null,
      segmentCount: segments.length,
      averageSegmentDuration: averageDuration,
      latencySeconds,
      bitrate,
      discontinuities,
      errors,
      alerts,          // <----- FRONTEND WILL USE THIS!
      raw: parsed,     // keep full playlist info
      probe: probeData // ffprobe raw data
    };
  } catch (err) {
    console.error("Stream Analysis Error:", err);
    throw err;
  }
};
