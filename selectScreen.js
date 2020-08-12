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
    thumb1.className = "row justify-content-start pt-2 mx-1";
    // thumb1.style = "width:275px";
    let sname = source.name.slice(0, 15) + "...";
    let img1 = document.createElement("img");
    img1.src = source.thumbnail.toDataURL();
    img1.id = source.id + "img";
    console.log("here : " + source.name);
    thumb1.innerHTML = `<div class="card pt-1" name="${source.name}" id="${source.id}" onclick="one(this)" data-toggle="tooltip" title="${source.name}">
                          <div class="card-body pt-1" >
                             <img src=${img1.src} id=${img1.id} class="rounded float-right" >
                          </div>
                          <div class="card-text text-center">${sname}</div>
                        </div> `;

    // thumb1.innerHTML = `<label>
    //                       <input type ="radio" name="thumbnail" class="card-input-element d-none" id="${source.id}">
    //                         <div class="card pt-1 id="">
    //                           <div class="card-body pt-1" id="${source.id}" name="${source.name}" onclick="one(this)" data-toggle="tooltip" title="${source.name}">
    //                              <img src=${img1.src} id=${img1.id} class="rounded float-right" >
    //                           </div>
    //                           <div class="card-text text-center">${name}</div>
    //                        </div>
    //                       </label>
    //  `;

    screens.appendChild(thumb1);
    screencount++;
  }
  // thumbpreview = document.getElementById("screen:0:0img").src;
  // console.log(thumbpreview);
  // document.getElementById(
  //   "preview"
  // ).innerHTML = `<img class="thumbnail"src="${thumbpreview}">`;
  // document.getElementById("footer").innerText = "Entire Screen";
});

function one(ele) {
  console.log("this" + ele.name);
  currentSelection = ele.id + "img";
  selectedScreen = ele.id;
  let cards = document.getElementsByClassName("card");
  for (const i in cards) {
    cards[i].className = "card pt-1";
  }
  document.getElementById(selectedScreen).className += " border-primary";
  document.getElementById(
    "preview"
  ).innerHTML = `<div class="alert alert-info">${ele.name}</div>`;
  console.log(currentSelection);
  console.log("Current Screen:" + selectedScreen);
  console.log(document.getElementById(currentSelection));
  thumbpreview = document.getElementById(currentSelection).src;
  console.log(thumbpreview);
  // document.getElementById(
  //   "preview"
  // ).innerHTML = `<img class="thumbnail"src="${thumbpreview}">`;
  // document.getElementById("footer").innerText = ele.name;
}

ipcRenderer.send("channel", "message");

ipcRenderer.on("channel", (event, message) => {
  console.log("message is " + message);
});
