"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("examBridge", {
    selectAudioDirectory: () => electron_1.ipcRenderer.invoke("select-audio-directory"),
    saveConfigFile: (config) => electron_1.ipcRenderer.invoke("save-config-file", config),
    openConfigFile: () => electron_1.ipcRenderer.invoke("open-config-file")
});
