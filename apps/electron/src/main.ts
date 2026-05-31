import { app, BrowserWindow, dialog, ipcMain, type OpenDialogOptions, type SaveDialogOptions } from "electron";
import { spawn, type ChildProcess } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");

const BACKEND_URL = "http://127.0.0.1:3099/api/config";
const FRONTEND_URL = "http://127.0.0.1:5173";
const isDevelopment = process.env.NODE_ENV === "development";

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

function log(message: string) {
  const logDirectory = path.resolve(process.cwd(), "data");
  mkdirSync(logDirectory, {
    recursive: true
  });
  appendFileSync(path.join(logDirectory, "electron.log"), `[${new Date().toISOString()}] ${message}\n`, "utf8");
}

function cleanEnv(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }

  return {
    ...env,
    ...extra
  };
}

function attachProcessLogs(child: ChildProcess, label: string) {
  child.stdout?.on("data", (chunk: Buffer) => log(`${label} stdout: ${chunk.toString().trimEnd()}`));
  child.stderr?.on("data", (chunk: Buffer) => log(`${label} stderr: ${chunk.toString().trimEnd()}`));
  child.on("exit", (code, signal) => log(`${label} exited code=${code ?? "null"} signal=${signal ?? "null"}`));
  child.on("error", (error) => log(`${label} error: ${error.stack ?? error.message}`));
}

async function waitForUrl(url: string, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // The server may still be starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function startBackend() {
  if (backendProcess) {
    return;
  }

  log(`starting backend, development=${isDevelopment}`);
  const backendMain = path.resolve(__dirname, "../backend/main.js");
  backendProcess = spawn(process.execPath, [backendMain], {
    cwd: process.cwd(),
    env: cleanEnv({
      ELECTRON_RUN_AS_NODE: "1",
      PORT: "3099"
    }),
    stdio: ["ignore", "pipe", "pipe"]
  });
  attachProcessLogs(backendProcess, "backend");
  log(`backend child pid=${backendProcess.pid ?? "unknown"}`);
}

function stopBackend() {
  if (!backendProcess?.pid || backendProcess.killed) {
    return;
  }

  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(backendProcess.pid), "/t", "/f"]);
  } else {
    backendProcess.kill("SIGTERM");
  }

  backendProcess = null;
}

function getDialogParent() {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}

function showOpenDialog(options: OpenDialogOptions) {
  const parent = getDialogParent();
  return parent ? dialog.showOpenDialog(parent, options) : dialog.showOpenDialog(options);
}

function showSaveDialog(options: SaveDialogOptions) {
  const parent = getDialogParent();
  return parent ? dialog.showSaveDialog(parent, options) : dialog.showSaveDialog(options);
}

async function createWindow() {
  log("creating window");
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 980,
    minHeight: 620,
    backgroundColor: "#08a8f3",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.maximize();
    mainWindow?.show();
  });

  startBackend();
  log("waiting for backend");
  await waitForUrl(BACKEND_URL);
  log("backend ready");

  if (isDevelopment) {
    log("waiting for frontend");
    await waitForUrl(FRONTEND_URL);
    log("frontend ready");
    await mainWindow.loadURL(FRONTEND_URL);
  } else {
    log("loading production frontend");
    await mainWindow.loadFile(path.resolve(__dirname, "../frontend/index.html"));
  }
}

ipcMain.handle("select-audio-directory", async () => {
  const result = await showOpenDialog({
    title: "选择音频文件夹",
    properties: ["openDirectory"]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("save-config-file", async (_event, config: unknown) => {
  const result = await showSaveDialog({
    title: "保存考试倒计时设置",
    defaultPath: "exam-countdown-config.json",
    filters: [
      {
        name: "JSON 配置文件",
        extensions: ["json"]
      }
    ]
  });

  if (result.canceled || !result.filePath) {
    return {
      canceled: true
    };
  }

  await fs.writeFile(result.filePath, JSON.stringify(config, null, 2), "utf8");
  return {
    canceled: false,
    path: result.filePath
  };
});

ipcMain.handle("open-config-file", async () => {
  const result = await showOpenDialog({
    title: "读取考试倒计时设置",
    properties: ["openFile"],
    filters: [
      {
        name: "JSON 配置文件",
        extensions: ["json"]
      }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return {
      canceled: true
    };
  }

  const filePath = result.filePaths[0];
  const raw = await fs.readFile(filePath, "utf8");
  return {
    canceled: false,
    path: filePath,
    config: JSON.parse(raw)
  };
});

app.whenReady().then(() => {
  log("app ready");
  createWindow().catch((error) => {
    log(`startup error: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
    dialog.showErrorBox("启动失败", error instanceof Error ? error.message : String(error));
    app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on("before-quit", stopBackend);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
