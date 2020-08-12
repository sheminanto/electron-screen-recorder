const { desktopCapturer, remote, ipcRenderer } = require("electron");
let screencount = 1;
let newRow;
let selectedScreen;
let currentSelection;
let thumbpreview;
thumb = document.getElementById("thumb");
screens = document.getElementById("screens");
thumbList = document.getElementById("thumbList");
screenList = document.getElementById("screenList");
element = document.getElementsByClassName("card");

async function getScreenSources() {
  return await desktopCapturer.getSources({
    types: ["window", "screen"],
  });
}
let _screenSources = getScreenSources();

getScreenSources().then((sources) => {
  for (const source of sources) {
    if (source.name == "Simple Screen" || source.name == "Select Screen")
      continue;

    // if (screencount % 3 == 0) {
    //   console.log("create row ");
    //   newRow = document.createElement("div");
    //   newRow.className = "row pt-2";
    //   screens.appendChild(newRow);
    // }
    let thumb1 = document.createElement("div");
    thumb1.className = "row justify-content-start";
    thumb1.style = "width:275px";
    let img1 = document.createElement("img");
    img1.src = source.thumbnail.toDataURL();
    img1.id = source.id + "img";
    console.log(img1.id);
    thumb1.innerHTML = `<div class="row ml-3 pt-1" style="width:230px"><a class="dropdown-item pt-1" id="${source.id}" name="${source.name}" onclick="one(this)" data-toggle="tooltip" title="${source.name}">${screencount}. <img src=${img1.src} id=${img1.id} class="rounded float-right" ></a></div> `;
    thumbList.appendChild(thumb1);
    screencount++;
  }
  thumbpreview = document.getElementById("screen:0:0img").src;
  console.log(thumbpreview);
  document.getElementById("preview").innerHTML = `<img src="${thumbpreview}">`;
  document.getElementById("footer").innerText = "Entire Screen";
});

function one(ele) {
  currentSelection = ele.id + "img";
  selectedScreen = ele.id;
  console.log(currentSelection);
  console.log("Current Screen:" + selectedScreen);
  console.log(document.getElementById(currentSelection));
  thumbpreview = document.getElementById(currentSelection).src;
  console.log(thumbpreview);
  document.getElementById("preview").innerHTML = `<img src="${thumbpreview}">`;
  document.getElementById("footer").innerText = ele.name;
}

ipcRenderer.send("channel", "message");

ipcRenderer.on("channel", (event, message) => {
  console.log("message is " + message);
});
