const { desktopCapturer, remote } = require("electron");

async function getScreenSources() {
  return await desktopCapturer.getSources({
    types: ["window", "screen"],
  });
}
let _screenSources = getScreenSources();

getScreenSources().then((sources) => {
  for (const source of sources) {
    console.log(source.name);
    // let img1 = document.createElement("img");
    // img1.src = source.thumbnail.toDataURL();
    // document.getElementById("id1").appendChild(img1);
  }
});
