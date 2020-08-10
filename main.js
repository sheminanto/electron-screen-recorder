// Modules to control application life and create native browser window
const { app, BrowserWindow } = require("electron");

// app.commandLine.appendSwitch("disable-gpu-vsync");
// app.commandLine.appendSwitch("disable-frame-rate-limit");

const path = require("path");
// const { ipcMain, dialog } = require("electron");
// const selectScreen = document.getElementById("selectScreen");
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    // resizable: false,
    width: 300,
    height: 500,

    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      //   preload: path.join(__dirname, "renderer.js"),
    },
  });
  mainWindow.setMenuBarVisibility(false);

  // and load the index.html of the app.
  mainWindow.loadFile("./index.html");

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

//Select Screen

// selectScreen.addEventListener("click", (event) => {
//   let win = new BrowserWindow({ width: 400, height: 320 });

//   win.on("close", () => {
//     win = null;
//   });
//   win.loadURL("./test.html");
//   win.show();
// });

//Save Dialog

// ipcMain.on("save-dialog", (event) => {
//   const options = {
//     title: "Select Destination FOlder",
//     filters: [{ name: "Movies", extensions: ["webm"] }],
//   };
//   dialog.showSaveDialog(options, (filename) => {
//     event.sender.send("saved-file", filename);

//   });
// });
