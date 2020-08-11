const { desktopCapturer, remote } = require("electron");
let screencount = 0;
let newRow;
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

    if (screencount % 3 == 0) {
      console.log("create row ");
      newRow = document.createElement("div");
      newRow.className = "row pt-2";
      screens.appendChild(newRow);
    }
    let thumb1 = document.createElement("div");
    thumb1.className = "col-sm-3 pt-1";
    let img1 = document.createElement("img");
    img1.src = source.thumbnail.toDataURL();
    console.log(source);
    thumb1.innerHTML = `<img src=${img1.src} class="rounded" data-toggle="tooltip" title="${source.name}" >`;
    newRow.appendChild(thumb1);
    screencount++;
  }
});
