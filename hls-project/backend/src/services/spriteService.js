const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.generateSprite = async (streamUrl, outputDir) => {
  return new Promise((resolve, reject) => {
    const framesDir = path.join(outputDir, "frames");

    fs.mkdirSync(framesDir, { recursive: true });

    // STEP 1 — extract frames
    const extractCmd = `
      ffmpeg -y -i "${streamUrl}" \
      -vf "fps=1/2,scale=160:90" \
      "${framesDir}/frame_%03d.jpg"
    `;

    exec(extractCmd, (err) => {
      if (err) return reject("Frame extraction failed: " + err);

      // STEP 2 — merge into sprite
      const spriteCmd = `
        ffmpeg -y -pattern_type glob \
        -i "${framesDir}/*.jpg" \
        -vf "tile=5x5" \
        -frames:v 1 \
        "${path.join(outputDir, "sprite.jpg")}"
      `;

      exec(spriteCmd, (err2) => {
        if (err2) return reject("Sprite creation failed: " + err2);

        resolve(true);
      });
    });
  });
};
