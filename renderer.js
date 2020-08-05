// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const { desktopCapturer } = require("electron");
let path = require("path");
let fs = require("fs");
let Hark = require("hark");
const nativeImage = require("electron").nativeImage;

let ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath("./win-ffmpeg/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("./win-ffmpeg/bin");

let recordedChunks = [];
let mediaRecorder;
let audioContext = new AudioContext();
let audiodevices;
let streamsav;
let _screenWidth;
let _screenHeight;
let _recordingState = false;

async function getAudioSources() {
  return navigator.mediaDevices.enumerateDevices().then((devices) => {
    audiodevices = devices.filter(
      (d) =>
        d.kind === "audioinput" &&
        d.deviceId != "communications" &&
        d.deviceId != "default"
    );
    return audiodevices;
  });
}

getAudioSources().then((sources) => {
  let _dropDownAudioInput = document.getElementById("dropdown-audioinput");
  let _dropDownitem;

  for (const source of sources) {
    _dropDownitem = document.createElement("a");
    _dropDownitem.className = "dropdown-item";
    _dropDownitem.href = "#";
    _dropDownitem.innerText = source.label;
    _dropDownAudioInput.appendChild(_dropDownitem);
    console.log(source);
  }
});

let audstream;

async function setAudio() {
  const audiostream1 = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: "default",
      autoGainControl: false,
      latency: 0.0,
      noiseSuppression: true,
      channelCount: 2,
      sampleSize: 16,
    },
  });

  const audiostream2 = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId:
        "ef454260e26728a3175e9b04546e19d73c0f59a0a57c6076fc42ac33bde4d760",
      autoGainControl: false,
      latency: 0.0,
      noiseSuppression: true,
      channelCount: 2,
      sampleSize: 16,
    },
  });
  // console.log(audiostream1.getAudioTracks()[0].getSettings());
  // console.log(audiostream2.getAudioTracks()[0].getSettings());

  let audioIn_01 = audioContext.createMediaStreamSource(audiostream1);
  let audioIn_02 = audioContext.createMediaStreamSource(audiostream2);

  let dest = audioContext.createMediaStreamDestination();

  audioIn_01.connect(dest);
  audioIn_02.connect(dest);

  return dest.stream;
}

async function getScreenSources() {
  return await desktopCapturer.getSources({
    types: ["window", "screen"],
  });
}

// getScreenSources().then((sources) => {
//   for (const source of sources) {
//     let img1 = document.createElement("img");
//     img1.src = source.thumbnail.toDataURL();
//     document.getElementById("id1").appendChild(img1);
//   }
// });

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
                // maxWidth: 1080,
                maxWidth: 1920,
                minHeight: 480,
                // maxHeight: 720,

                maxHeight: 1080,
              },
            },
          });

          stream.getVideoTracks()[0].applyConstraints({ frameRate: 30 });
          // console.log(stream.getVideoTracks()[0].getSettings());

          // stream.addTrack((await setAudio()).getTracks()[0]);
          // console.log(stream.getAudioTracks()[0].getSettings());

          audstream = await setAudio();
          stream.addTrack(audstream.getAudioTracks()[0]);

          let progressBAr = document.getElementById("progress-1");

          let audioMonitor = new Hark(audstream, {
            interval: 110,
            threshold: -120,
          });
          audioMonitor.on("volume_change", (volume) => {
            progressBAr.style.width = `${volume + 120}%`;
          });

          writeStream(stream);
          // handleStream(stream);
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
  let video = document.createElement("video");
  video.srcObject = stream;
  video.width = "200";
  video.autoplay = true;
  video.muted = true;
  let element = document.getElementById("id1");
  element.appendChild(video);
  video.onloadedmetadata = (e) => video.play();
}

function fileCheck(filePath, fileName, fileExt, _fileCount) {
  let tempName = "";
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
  let filePath;
  let fileName;
  let fileExt;
  let blob;
  let buffer;

  let options = {
    mimeType: "video/webm; codecs=vp9,opus",
    // audioBitsPerSecond: 92000,
    // videoBitsPerSecond: 1000000,
  };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  const startBtn = document.getElementById("startBtn");
  startBtn.onclick = (e) => {
    if (_recordingState == false) {
      filePath = "./recorded/";
      fileName = "data.webm";
      fileExt = ".webm";
      fileName = fileCheck(filePath, fileName, fileExt, 0);
      streamsav = fs.createWriteStream(filePath + fileName + fileExt);
      mediaRecorder.start(1000);
      startBtn.className = "btn btn-danger";
      startBtn.innerText = "Stop Recording";
      _recordingState = true;
    } else {
      try {
        mediaRecorder.stop();
      } catch (error) {
        console.log(error);
      }
      startBtn.className = "btn btn-success";
      startBtn.innerText = "Start Recording";
      _recordingState = false;
    }
  };

  // Captures all recorded chunks
  async function handleDataAvailable(e) {
    console.log("video data available");
    recordedChunks.push(e.data);
    blob = new Blob(recordedChunks, {
      type: "video/webm; codecs=vp9 ",
    });

    buffer = Buffer.from(await blob.arrayBuffer());
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
