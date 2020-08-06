var ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath("./win-ffmpeg/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("./win-ffmpeg/bin/ffprobe.exe");

ffmpeg("./recorded/data.webm")
  .videoCodec("libx264")
  .audioCodec("aac")
  .format("mp4")
  .save("./recorded/zzzz.mp4")
  .on("error", function (err) {
    console.log("An error occurred: " + err.message);
  })
  .on("end", function () {
    console.log("Processing finished !");
  })
  .on("progress", function (progress) {
    console.log(progress);
  });

// Create a clone to save a small resized version

// Save a converted version with the original size
