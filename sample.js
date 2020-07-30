var displayMediaOptions = {
  video: {
    cursor: "always",
  },
  audio: false,
};

async function startCapture() {
  //   logElem.innerHTML = "";

  try {
    var stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always",
      },
      audio: false,
    });
    // dumpOptionsInfo();
  } catch (err) {
    console.error("Error: " + err);
  }
}

function dumpOptionsInfo() {
  const videoTrack = videoElem.srcObject.getVideoTracks()[0];

  console.log("Track settings:");
  console.log(JSON.stringify(videoTrack.getSettings(), null, 2));
  console.log("Track constraints:");
  console.log(JSON.stringify(videoTrack.getConstraints(), null, 2));
}

startCapture();
