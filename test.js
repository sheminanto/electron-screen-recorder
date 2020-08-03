var ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath("./win-ffmpeg/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("./win-ffmpeg/bin");
var fs = require("fs");

var ffmpegoutstream = fs.createWriteStream("test.mp4");

var command = ffmpeg(
  "C:/Users/hp/Desktop/electron-screen-recorder/recorded/data.webm"
)
  .videoCodec("libx264")
  .audioCodec("libmp3lame")
  .size("320x240")
  .on("error", function (err) {
    console.log("An error occurred: " + err.message);
  })
  .on("end", function () {
    console.log("Processing finished !");
  })
  .output(ffmpegoutstream);

// Create a clone to save a small resized version

// Save a converted version with the original size
