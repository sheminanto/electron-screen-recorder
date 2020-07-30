// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const { desktopCapturer } = require("electron");
var fs = require("fs");
var streamsav;
streamsav = fs.createWriteStream("./data.webm");

var ffmpeg = require("fluent-ffmpeg");
var command = ffmpeg();

var recordedChunks = [];
let mediaRecorder;
// var audiodevices;

// navigator.mediaDevices.enumerateDevices().then((devices) => {
//   audiodevices = devices.filter((d) => d.kind === "audioinput");
//   console.log(audiodevices);
// });

async function setAudio() {
  const audiostream = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: "default",
    },
  });

  // var audio = document.createElement("audio");

  // audio.srcObject = audiostream;
  // audio.controls = true;

  // audio.autoplay = true;

  // var element = document.getElementById("id1");
  // element.appendChild(audio);
  // audio.onloadedmetadata = (e) => audio.play();
  return audiostream;
}
var audio = setAudio();

desktopCapturer
  .getSources({ types: ["window", "screen", "audio"] })
  .then(async (sources) => {
    for (const source of sources) {
      console.log(source.name);
      // if (source.name === "Entire Screen") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          // {
          //   mandatory: {
          //     chromeMediaSource: "desktop",
          //   },
          // },
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: source.id,
              minWidth: 1280,
              // maxWidth: 1920,
              minHeight: 720,
              // maxHeight: 1080,
            },
          },
        });
        // stream.addTrack(
        //   await navigator.mediaDevices
        //     .getUserMedia({
        //       audio: {
        //         deviceId: "default",
        //       },
        //     })
        //     .then((audios) => {
        //       return audios.getAudioTracks()[0];
        //     })
        // );
        stream.addTrack((await audio).getTracks()[0]);

        handleStream(stream);
        writeStream(stream);
      } catch (e) {
        handleError(e);
      }
      return;
      // }
    }
  });

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
function writeStream(stream) {
  var options = {
    // mimeType: "video/webm; codecs=vp9",
  };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  const startBtn = document.getElementById("startBtn");
  startBtn.onclick = (e) => {
    mediaRecorder.start(1000);
    startBtn.classList.add("is-danger");
    startBtn.innerText = "Recording";
  };

  const stopBtn = document.getElementById("stopBtn");
  stopBtn.onclick = (e) => {
    mediaRecorder.stop();
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
    console.log("hello finished");
    // const blob = new Blob(recordedChunks, {
    //   type: "video/webm; codecs=vp9",
    // });

    // const buffer = Buffer.from(await blob.arrayBuffer());

    // const filePath = "./test3.webm";

    // console.log(filePath);

    // writeFile(filePath, buffer, () => console.log("video saved successfully!"));
  }
}

function handleError(e) {
  console.log(e);
}
