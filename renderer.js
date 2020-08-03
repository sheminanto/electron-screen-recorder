// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const { desktopCapturer } = require("electron");
var path = require("path");
var fs = require("fs");

var ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath("./win-ffmpeg/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("./win-ffmpeg/bin");

var recordedChunks = [];
let mediaRecorder;
const audioContext = new AudioContext();
var audiodevices;
var streamsav;
var ffmpegoutstream = fs.createWriteStream("./recorded/testff.mp4");

// navigator.mediaDevices.enumerateDevices().then((devices) => {
//   audiodevices = devices.filter((d) => d.kind === "audioinput");
//   for (const item of audiodevices) {
//     console.log(item);
//   }
// });

async function setAudio() {
  const audiostream1 = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: "default",
      autoGainControl: false,
      latency: 0.01,
      noiseSuppression: false,
      channelCount: 2,
      echoCancellation: false,
      sampleSize: 16,
    },
  });

  const audiostream2 = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId:
        "93a5d0fc38f85fefb46f4a8868ef9d5241d526c142d0b6bc059dbc01fa7ca7e8",
      autoGainControl: false,
      latency: 0.01,
      noiseSuppression: false,
      channelCount: 2,
      echoCancellation: false,
      sampleSize: 16,
    },
  });
  // console.log(audiostream1.getAudioTracks()[0].getSettings());
  // console.log(audiostream2.getAudioTracks()[0].getSettings());

  var audioIn_01 = audioContext.createMediaStreamSource(audiostream1);
  var audioIn_02 = audioContext.createMediaStreamSource(audiostream2);

  var dest = audioContext.createMediaStreamDestination();

  audioIn_01.connect(dest);
  audioIn_02.connect(dest);

  return dest.stream;
}

function setScreen() {
  desktopCapturer
    .getSources({ types: ["window", "screen"] })
    .then(async (sources) => {
      for (const source of sources) {
        console.log(source.name);
        // if (source.name === "Entire Screen") {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,

            video: {
              mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: source.id,
                minWidth: 640,
                maxWidth: 1080,
                // maxWidth: 1920,
                minHeight: 480,
                maxHeight: 720,

                // maxHeight: 1080,
              },
            },
          });

          stream.getVideoTracks()[0].applyConstraints({ frameRate: 30 });
          // console.log(stream.getVideoTracks()[0].getSettings());

          stream.addTrack((await setAudio()).getTracks()[0]);
          // console.log(stream.getAudioTracks()[0].getSettings());

          writeStream(stream);
          handleStream(stream);
        } catch (e) {
          handleError(e);
        }
        return;
        // }
      }
    });
}
setScreen();

async function handleStream(stream) {
  var video = document.createElement("video");
  video.srcObject = stream;
  video.width = "200";
  video.autoplay = true;
  video.muted = true;
  var element = document.getElementById("id1");
  element.appendChild(video);
  video.onloadedmetadata = (e) => video.play();
}

function fileCheck(filePath, fileName, fileExt, _fileCount) {
  var tempName = "";
  try {
    fileName = path.basename(filePath + fileName, fileExt);
    _fileCount == 0 ? (tempName = "") : (tempName = `(${_fileCount})`);
    if (fs.existsSync(filePath + fileName + tempName + fileExt)) {
      _fileCount += 1;
      console.log(fileName);
      console.log("file exists");
      fileName = fileCheck(filePath, fileName, fileExt, _fileCount);
      return fileName;
    } else {
      console.log("file not exists");
      return fileName + tempName;
    }
  } catch (err) {
    console.log(err);
  }
}

async function writeStream(stream) {
  var filePath = "./recorded/";
  var fileName = "data.webm";
  var fileExt = ".webm";

  var options = {
    mimeType: "video/webm; codecs=vp9",
  };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  const startBtn = document.getElementById("startBtn");
  startBtn.onclick = (e) => {
    filePath = "./recorded/";
    fileName = "data.webm";
    fileExt = ".webm";
    fileName = fileCheck(filePath, fileName, fileExt, 0);
    streamsav = fs.createWriteStream(filePath + fileName + fileExt);

    mediaRecorder.start(1000);
    startBtn.classList.add("is-danger");
    startBtn.innerText = "Recording";
  };

  const stopBtn = document.getElementById("stopBtn");
  stopBtn.onclick = (e) => {
    try {
      mediaRecorder.stop();
    } catch (error) {
      console.log(error);
    }

    startBtn.classList.remove("is-danger");
    startBtn.innerText = "Start";
  };

  // Captures all recorded chunks
  async function handleDataAvailable(e) {
    console.log("video data available");
    recordedChunks.push(e.data);
    const blob = new Blob(recordedChunks, {
      type: "video/webm; codecs=vp9",
    });

    const buffer = Buffer.from(await blob.arrayBuffer());
    streamsav.write(buffer);

    recordedChunks = [];
  }

  async function handleStop(e) {
    // stream.getTracks().forEach((track) => {
    //   track.stop();
    // });

    // const blob = new Blob(recordedChunks, {
    //   type: "video/webm; codecs=vp9",
    // });

    // const buffer = Buffer.from(await blob.arrayBuffer());

    // const filePath = "./test3.webm";

    // console.log(filePath);

    // writeFile(filePath, buffer, () => console.log("video saved successfully!"));

    console.log("hello finished");
  }
}

function handleError(e) {
  console.log(e);
}
