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

let ffmpeg = require("fluent-ffmpeg");

ffmpeg.setFfmpegPath("./resources/app/win-ffmpeg/bin/ffmpeg.exe");
ffmpeg.setFfprobePath("./resources/win-ffmpeg/bin/ffprobe.exe");
ffmpeg.getAvailableCodecs((err, codecs) => {
  if (err) {
    ffmpeg.setFfmpegPath("win-ffmpeg/bin/ffmpeg.exe");
    ffmpeg.setFfprobePath("win-ffmpeg/bin/ffprobe.exe");
  }
});

let recordedChunks = [];
let mediaRecorder;
let audioContext = new AudioContext();
let dest = audioContext.createMediaStreamDestination();
let audiodevices;

let _screenWidth = 1980;
let _screenHeight = 1080;
let _recordingState = false;
let audstream;
let _audioSources;
let _audioDevicesCount = 0;
let streamsav;
const startBtn = document.getElementById("startBtn");

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
async function setAudio(source) {
  const audiostream1 = await navigator.mediaDevices.getUserMedia({
    audio: {
      deviceId: source.deviceId,
      autoGainControl: false,
      latency: 0.0,
    },
  });

  let audioIn_01 = audioContext.createMediaStreamSource(audiostream1);

  audioIn_01.connect(dest);

  return audioIn_01;
}
_audioSources = getAudioSources();

_audioSources.then(async (sources) => {
  let _dropDownAudioInput = document.getElementById("dropdown-audioinput");
  let _meterSection = document.getElementById("audio-meter-section");

  for (const source of sources) {
    let _audioLevel;
    let stream;
    let audioMonitor;
    let _audioMeter = document.createElement("div");
    let _dropDownitem = document.createElement("a");
    let progressBAr;
    _audioMeter.className = `row pt-4 `;
    _audioMeter.innerHTML = ` <div class="col">
      <div class="progress" style="height: 10px;">
        <div
          class="progress-bar"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          id="audio-meter-${source.deviceId}"
        ></div>
      </div>
    </div>`;

    _dropDownitem.className = "dropdown-item ";
    _dropDownitem.innerHTML = `<form>
    <div class="custom-control custom-switch">
      <input
        type="checkbox"
        class="custom-control-input"
        id="${source.deviceId}"
      />
      <label class="custom-control-label" for="${source.deviceId}">
        ${source.label}
      </label>
    </div>
  </form>`;
    _dropDownAudioInput.appendChild(_dropDownitem);
    document
      .getElementById(source.deviceId)
      .addEventListener("change", (change) => {
        if (change.target.checked) {
          _audioDevicesCount += 1;
          _meterSection.appendChild(_audioMeter);
          progressBAr = document.getElementById(
            `audio-meter-${source.deviceId}`
          );
          setAudio(source).then((res) => {
            stream = res;
            audioMonitor = new Hark(res.mediaStream, {
              interval: 110,
            });

            audioMonitor.on("volume_change", (volume) => {
              _audioLevel = volume * 0.85 + 100;
              if (_audioLevel <= 0) {
                progressBAr.style.width = "0%";
              } else {
                progressBAr.style.width = `${_audioLevel}%`;
              }
            });
            console.log(res.mediaStream.getAudioTracks()[0].readyState);
          });
          console.log("true");
        } else {
          _audioDevicesCount -= 1;
          stream.disconnect(dest);
          _audioMeter.remove();
          audioMonitor.stop();
          stream.mediaStream.getTracks().forEach((item) => item.stop());
          console.log(stream.mediaStream.getAudioTracks()[0].readyState);
          progressBAr.style.width = "0%";
          console.log("false");
          stream = null;
          progressBAr = null;
          audioMonitor = null;
        }
      });
  }
});

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

async function setScreen() {
  return await desktopCapturer
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
                maxWidth: _screenWidth,
                minHeight: 480,
                maxHeight: _screenHeight,
              },
            },
          });

          stream.getVideoTracks()[0].applyConstraints({ frameRate: 30 });
          // console.log(stream.getVideoTracks()[0].getSettings());

          // stream.addTrack((await setAudio()).getTracks()[0]);
          // console.log(stream.getAudioTracks()[0].getSettings());

          // audstream = await setAudio();
          // audstream = dest.stream;
          // stream.addTrack(audstream.getAudioTracks()[0]);

          // stream.getTracks().forEach((track) => track.stop());
          return stream;

          await writeStream(stream);
          // handleStream(stream);
        } catch (e) {
          handleError(e);
        }
        return;
        // }
      }
    });
}
// setScreen();

startBtn.onclick = () => {
  let videoStream = setScreen();
  videoStream.then((stream) => console.log(stream));
  console.log("hello");
};

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

  const startBtn = document.getElementById("startBtn");

  let options = {
    mimeType: "video/webm; codecs=vp9,opus",
    // audioBitsPerSecond: 92000,
    // videoBitsPerSecond: 1000000,
  };

  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
  mediaRecorder.onstart = () => {
    startBtn.className = "btn btn-danger";
    startBtn.innerText = "Stop Recording";
    _recordingState = true;
    console.log("started recording ->" + _recordingState);
  };

  function handleStop() {
    startBtn.className = "btn btn-success";
    startBtn.innerText = "Start Recording";
    _recordingState = false;

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

    ffmpeg(filePath + fileName + fileExt)
      .videoCodec("libx264")
      .audioCodec("aac")
      .format("mp4")
      .save(filePath + fileName + "-converted.mp4")
      .on("error", function (err) {
        console.log("An error occurred: " + err.message);
      })
      .on("end", function () {
        console.log("Processing finished !");
      })
      .on("progress", function (progress) {
        console.log(progress);
      });
  }

  startBtn.onclick = (e) => {
    if (_recordingState == false) {
      if (_audioDevicesCount != 0) {
        stream.addTrack(dest.stream.getAudioTracks()[0]);
      } else {
        stream.getAudioTracks().forEach((track) => stream.removeTrack(track));
      }
      filePath = "./recorded/";
      fileName = "data.webm";
      fileExt = ".webm";
      fileName = fileCheck(filePath, fileName, fileExt, 0);
      streamsav = fs.createWriteStream(filePath + fileName + fileExt);

      try {
        mediaRecorder.start(100);
      } catch (error) {
        console.log(error);
      }
    } else {
      try {
        mediaRecorder.stop();
      } catch (error) {
        console.log(error);
      }
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
}

function handleError(e) {
  console.log(e);
}
