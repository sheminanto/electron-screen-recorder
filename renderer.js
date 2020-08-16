// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const { desktopCapturer, remote, ipcRenderer } = require("electron");
const { BrowserWindow } = require("electron").remote;
const { ipcMain } = require("electron");
const { dialog } = require("electron").remote;
let currentScreen;
getScreenSources().then((sources) => (currentScreen = sources[0].id)); // screen to recorded currently is set using this
let path = require("path");
let fs = require("fs");
let Hark = require("hark");

let ffmpeg = require("fluent-ffmpeg");
// const { time } = require("console");
// const { title } = require("process");

// setting the path of ffmpeg in development and production versions
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

let _screenWidth;
let _screenHeight;
let _recordingState = false;
let _audioSources;
let _audioDevicesCount = 0;
let streamsav;
let filePath = remote.app.getPath("videos") + "/";
let fileName;
let fileExt;
let blob;
let buffer;
let screenWindow = false;

const _converToMp4 = document.getElementById("mp4-convert");

const startBtn = document.getElementById("startBtn");
const _dropDownAudioInput = document.getElementById("dropdown-audioinput");
const selectScreenBtn = document.getElementById("selectScreen");
const saveBtn = document.getElementById("save-dialog");
const _resolutionBtnGroup = document.getElementsByName("options");
const _inputDestination = document.getElementById("inputDestination");
const _dropDownAudioMenuButton = document.getElementById("dropdownMenuButton");
_inputDestination.value = filePath;

navigator.mediaDevices
  .enumerateDevices()
  .then(function (devices) {
    devices.forEach(function (device) {
      console.log(
        device.kind + ": " + device.label + " id = " + device.deviceId
      );
    });
  })
  .catch(function (err) {
    console.log(err.name + ": " + err.message);
  });

async function getAudioSources() {
  return navigator.mediaDevices.enumerateDevices().then((devices) => {
    audiodevices = devices.filter(
      (d) =>
        (d.kind === "audioinput" ||
        d.kind === "audiooutput") &&
        d.deviceId != "communications" &&
        d.deviceId != "default"
    );
    console.log(audiodevices);
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
  const _meterSection = document.getElementById("audio-meter-section");

  for (const source of sources) {
    let _audioLevel;
    let stream;
    let audioMonitor;
    let sourceLabel =
      source.label.length > 30
        ? source.label.slice(0, 29) + "..."
        : source.label;
    console.log(sourceLabel);
    console.log(source.deviceId);
    const _audioMeter = document.createElement("div");
    const _dropDownitem = document.createElement("a");
    let progressBAr;
    _audioMeter.className = `row  pt-1 `;
    _audioMeter.innerHTML = ` <div class="col">
      <div class="progress" style="height: 8px;">
        <div
          class="progress-bar"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          id="audio-meter-${source.deviceId}"
        ></div>
      </div><small data-toggle="tooltip" title="${source.label}">${sourceLabel}</small>
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
      <small data-toggle="tooltip" title="${source.label}">${sourceLabel}</small>
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

async function setScreen(sourceid) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: sourceid,
          minWidth: 640,
          maxWidth: _screenWidth,
          minHeight: 480,
          maxHeight: _screenHeight,
        },
      },
    });

    stream.getVideoTracks()[0].applyConstraints({ frameRate: 30 });

    return stream;
    // await writeStream(stream);

    // handleStream(stream);
  } catch (e) {
    handleError(e);
  }
}
// setScreen("screen:0:0");

startBtn.onclick = () => {
  if (_recordingState == false) {
    disableAll();
    setScreenResolution();
    let videoStream = setScreen(currentScreen);
    // filePath = "./recorded/";
    fileName = "data";
    fileExt = ".webm";
    fileName = fileCheck(filePath, fileName, fileExt, 0);
    streamsav = fs.createWriteStream(filePath + fileName + fileExt);
    videoStream.then((stream) => {
      if (_audioDevicesCount != 0) {
        stream.addTrack(dest.stream.getAudioTracks()[0]);
      }
      let options = {
        mimeType: "video/webm; codecs=vp9",
        // audioBitsPerSecond: 92000,
        // videoBitsPerSecond: 1000000,
      };
      mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorder.onstart = handleStart;
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.onstop = () => handleStop(stream);
      try {
        mediaRecorder.start(1000);
      } catch (error) {
        console.log(error);
      }
    });
  } else {
    enableAll();
    try {
      mediaRecorder.stop();
    } catch (error) {
      console.log(error);
    }
  }
};
function handleStart() {
  startBtn.className = "btn btn-danger";
  startBtn.innerText = "Stop Recording";
  _recordingState = true;
  console.log("started recording ->" + _recordingState);
}

async function handleDataAvailable(e) {
  console.log("video data available");
  recordedChunks.push(e.data);
  blob = new Blob(recordedChunks, {
    // type: "video/webm; codecs=vp9 ",
  });
  buffer = Buffer.from(await blob.arrayBuffer());
  streamsav.write(buffer);
  recordedChunks = [];
}

async function handleStop(stream) {
  setTimeout(() => {
    streamsav.end();
    console.log("timeout");
    console.log(_converToMp4.checked);
    if (_converToMp4.checked) _convert();
    stream.getVideoTracks().forEach((track) => track.stop());
  }, 1000);

  startBtn.className = "btn btn-success";
  startBtn.innerText = "Start Recording";
  _recordingState = false;
}

async function _convert() {
  console.log("inside convert");
  try {
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
  } catch (error) {
    console.log("ffmpeg error : " + error);
  }
}

// async function handleStream(stream) {
//   let video = document.createElement("video");
//   video.srcObject = stream;
//   video.width = "200";
//   video.autoplay = true;
//   video.muted = true;
//   let element = document.getElementById("id1");
//   element.appendChild(video);
//   video.onloadedmetadata = (e) => video.play();
// }

function fileCheck(filePath, fileName, fileExt, _fileCount) {
  let tempName = "";
  try {
    // fileName = path.basename(filePath + fileName, fileExt);
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

function handleError(e) {
  console.log(e);
}

//SaveDialog

saveBtn.addEventListener("click", (event) => {
  console.log("clicked");
  dialog
    .showOpenDialog({
      title: "Save Recording",
      defaultPath: remote.app.getPath("videos"),
      buttonLabel: "Select Folder",
      properties: ["openDirectory"],
    })
    .then((selectedPath) => {
      if (selectedPath) {
        _inputDestination.value = selectedPath.filePaths;
        filePath = selectedPath.filePaths + "\\";
      }
    });
});
// For testing purposes.
const { webFrame } = require("electron");
const { Console } = require("console");
document.addEventListener("keydown", (e) => {
  if (e.key == "c") {
    webFrame.clearCache();
    console.log("CLEARED");
  }
});

// Select Screen
selectScreenBtn.addEventListener("click", (event) => {
  if (screenWindow == false) {
    screenWindow = true;
    let win = new BrowserWindow({
      resizable: false,
      width: 450,
      height: 550,
      webPreferences: {
        // devTools: false,
        nodeIntegration: true,
      },
    });
    win.loadFile("./selectScreen.html");
    win.setMenuBarVisibility(false);
    // win.webContents.send("channel", "hello");
    win.webContents.on("did-finish-load", () => {
      win.webContents.send("channel", "hello");
    });
    // win.webContents.openDevTools();
    console.log(screenWindow);

    win.on("close", () => {
      screenWindow = false;
      console.log(screenWindow);
      win = null;
    });
  }
});

remote.ipcMain.on("channel", (event, message) => {
  currentScreen = message;
  console.log("message event:" + event.title);
  console.log("message is " + message);
  // document.getElementById(
  //   "screen-preview-section"
  // ).innerHTML = `<img src="${message}" class="mx-auto d-block">`;
  event.sender.send("channel", currentScreen);
});

remote.ipcMain.on("did-finish-load", (event, message) => {
  event.sender.send("did-finish-load", currentScreen);
  console.log("message event:" + event.title);
  console.log("message is " + message);
  // document.getElementById(
  //   "screen-preview-section"
  // ).innerHTML = `<img src="${message}" class="mx-auto d-block">`;
});

//  function to set the screen resolution
function setScreenResolution() {
  _resolutionBtnGroup.forEach((item) => {
    if (item.checked) {
      console.log(item.value);
      switch (item.value) {
        case "720":
          _screenHeight = 720;
          _screenWidth = 1280;
          break;
        case "1080":
          _screenHeight = 1080;
          _screenWidth = 1920;
          break;

        default:
          console.log(
            "error in setScreenResolution. Screen resolution set to 1080p"
          );
          _screenHeight = 1080;
          _screenWidth = 1920;
          break;
      }
    }
  });
}

function disableAll() {
  _resolutionBtnGroup.forEach((item) =>
    item.setAttribute("disabled", "disabled")
  );
  saveBtn.setAttribute("disabled", "disabled");
  selectScreenBtn.setAttribute("disabled", "disabled");
  _inputDestination.setAttribute("disabled", "disabled");
  _dropDownAudioMenuButton.setAttribute("disabled", "disabled");
}

function enableAll() {
  _resolutionBtnGroup.forEach((item) => item.removeAttribute("disabled"));
  saveBtn.removeAttribute("disabled");
  selectScreenBtn.removeAttribute("disabled");
  _inputDestination.removeAttribute("disabled");
  _dropDownAudioMenuButton.removeAttribute("disabled");
}
