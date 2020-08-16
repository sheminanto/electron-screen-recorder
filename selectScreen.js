const { desktopCapturer, remote, ipcRenderer } = require("electron");
const win = remote.getCurrentWindow();
const okBtn = document.getElementById("okBtn");
const cancelBtn = document.getElementById("cancelBtn");
let screencount = 1;

let selectedScreen;
thumb = document.getElementById("thumb");
screens = document.getElementById("screens");

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

    let thumb1 = document.createElement("div");
    thumb1.className = "row justify-content-start pt-2 mx-1";

    let sname =
      source.name.length > 15 ? source.name.slice(0, 15) + "..." : source.name;
    let img1 = document.createElement("img");
    img1.src = source.thumbnail.toDataURL();
    img1.id = source.id + "img";
    console.log("here : " + source.name);
    thumb1.innerHTML = `<div class="card bg-light py-2" name="${source.name}" id="${source.id}" onclick="one(this)" data-toggle="tooltip" title="${source.name}">
                          <div class="card-body pt-1" >
                              <img src=${img1.src} id=${img1.id} class="rounded float-right" >
                          </div>
                          <div class="card-text text-center">${sname}</div>
                        </div> `;

    screens.appendChild(thumb1);
    screencount++;
  }

  ipcRenderer.send("did-finish-load", "finish load");
  console.log("hai" + win.closable);

  ipcRenderer.on("did-finish-load", (event, message) => {
    console.log("message is " + message);
    selectedScreen = message;
    console.log(selectedScreen);
    console.log(document.getElementById(message));
    let _prevScreen = document.getElementById(message);
    _prevScreen.className += " border-primary";
  });
});

function one(ele) {
  console.log("this" + ele.name);
  selectedScreen = ele.id;
  _highlight();
  document.getElementById(selectedScreen).className += " border-primary";
  console.log("Current Screen:" + selectedScreen);
}

okBtn.addEventListener("click", (event) => {
  ipcRenderer.send("channel", selectedScreen);
  // console.log(currentWindow);
  win.close();
});
cancelBtn.addEventListener("click", (event) => {
  // window.top.close();
  win.close();
});

//hightlight current selection
function _highlight() {
  let cards = document.getElementsByClassName("card");
  for (const i in cards) {
    cards[i].className = "card bg-light py-2";
  }
}
