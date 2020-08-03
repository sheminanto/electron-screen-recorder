var ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath("./win-ffmpeg/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("./win-ffmpeg/bin/ffprobe.exe");
var fs = require("fs");

var ffmpegoutstream = fs.createWriteStream("test3.mp4");

ffmpeg("./recorded/data.webm")
  .videoCodec("libx264")
  .audioCodec("aac")
  .format("mp4")
  .outputOptions([
    "-frag_duration 100",
    "-movflags frag_keyframe+faststart",
    "-pix_fmt yuv420p",
  ])
  .pipe(ffmpegoutstream, { end: true })

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
