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

var recordedChunks = [];
let mediaRecorder;

desktopCapturer
  .getSources({ types: ["window", "screen"] })
  .then(async (sources) => {
    for (const source of sources) {
      // if (source.name === "Entire Screen") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: source.id,
              minWidth: 1280,
              maxWidth: 1280,
              minHeight: 720,
              maxHeight: 720,
            },
          },
        });
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

  var element = document.getElementById("id1");
  element.appendChild(video);
  video.onloadedmetadata = (e) => video.play();
}
function writeStream(stream) {
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
