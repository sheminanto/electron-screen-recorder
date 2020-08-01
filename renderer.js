// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const { desktopCapturer } = require("electron");

var fs = require("fs");
// const { writeFile } = require("fs");

var streamsav = fs.createWriteStream("./data.webm");

var ffmpeg = require("fluent-ffmpeg");
const { chrome } = require("process");
var command = ffmpeg();

var recordedChunks = [];
let mediaRecorder;
const audioContext = new AudioContext();
var audiodevices;
var newStream;

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
      latency: 0,
      noiseSuppression: false,
      channelCount: 2,
      echoCancellation: false,
    },
  });
  const audiostream2 = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId:
        "93a5d0fc38f85fefb46f4a8868ef9d5241d526c142d0b6bc059dbc01fa7ca7e8",
      autoGainControl: false,
      latency: 0,
      noiseSuppression: false,
      channelCount: 2,
      echoCancellation: false,
    },
  });

  var audioIn_01 = audioContext.createMediaStreamSource(audiostream1);
  var audioIn_02 = audioContext.createMediaStreamSource(audiostream2);

  var dest = audioContext.createMediaStreamDestination();

  audioIn_01.connect(dest);
  audioIn_02.connect(dest);

  newStream = dest.stream;

  return newStream;
}

desktopCapturer
  .getSources({ types: ["window", "screen"] })
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
              minWidth: 640,
              maxWidth: 1080,
              // maxWidth: 1920,
              minHeight: 480,
              maxHeight: 720,

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

        // mainstream.addTrack((await setAudio("default")).getTracks()[0]);
        // mainstream.addTrack(
        //   (
        //     await setAudio(
        //       "93a5d0fc38f85fefb46f4a8868ef9d5241d526c142d0b6bc059dbc01fa7ca7e8"
        //     )
        //   ).getTracks()[0]
        // );

        stream.getVideoTracks()[0].applyConstraints({ frameRate: 35 });
        console.log(stream.getVideoTracks()[0].getSettings());
        stream.addTrack((await setAudio()).getTracks()[0]);

        writeStream(stream);
        handleStream(stream);
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

async function writeStream(stream) {
  var options = {
    mimeType: "video/webm; codecs=vp9",
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
    // streamsav.close();
    console.log("hello finished");
  }
}

function handleError(e) {
  console.log(e);
}
