import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("examBridge", {
  selectAudioDirectory: () => ipcRenderer.invoke("select-audio-directory"),
  saveConfigFile: (config: unknown) => ipcRenderer.invoke("save-config-file", config),
  openConfigFile: () => ipcRenderer.invoke("open-config-file")
});
