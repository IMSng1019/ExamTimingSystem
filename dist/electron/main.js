"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_child_process_1 = require("node:child_process");
const node_fs_1 = require("node:fs");
const node_fs_2 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
electron_1.app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
const BACKEND_URL = "http://127.0.0.1:3099/api/config";
const FRONTEND_URL = "http://127.0.0.1:5173";
const isDevelopment = process.env.NODE_ENV === "development";
let mainWindow = null;
let backendProcess = null;
function log(message) {
    const logDirectory = node_path_1.default.resolve(process.cwd(), "data");
    (0, node_fs_1.mkdirSync)(logDirectory, {
        recursive: true
    });
    (0, node_fs_1.appendFileSync)(node_path_1.default.join(logDirectory, "electron.log"), `[${new Date().toISOString()}] ${message}\n`, "utf8");
}
function cleanEnv(extra = {}) {
    const env = {};
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
function attachProcessLogs(child, label) {
    child.stdout?.on("data", (chunk) => log(`${label} stdout: ${chunk.toString().trimEnd()}`));
    child.stderr?.on("data", (chunk) => log(`${label} stderr: ${chunk.toString().trimEnd()}`));
    child.on("exit", (code, signal) => log(`${label} exited code=${code ?? "null"} signal=${signal ?? "null"}`));
    child.on("error", (error) => log(`${label} error: ${error.stack ?? error.message}`));
}
async function waitForUrl(url, timeoutMs = 30000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return;
            }
        }
        catch {
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
    const backendMain = node_path_1.default.resolve(__dirname, "../backend/main.js");
    backendProcess = (0, node_child_process_1.spawn)(process.execPath, [backendMain], {
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
        (0, node_child_process_1.spawn)("taskkill", ["/pid", String(backendProcess.pid), "/t", "/f"]);
    }
    else {
        backendProcess.kill("SIGTERM");
    }
    backendProcess = null;
}
function getDialogParent() {
    return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}
function showOpenDialog(options) {
    const parent = getDialogParent();
    return parent ? electron_1.dialog.showOpenDialog(parent, options) : electron_1.dialog.showOpenDialog(options);
}
function showSaveDialog(options) {
    const parent = getDialogParent();
    return parent ? electron_1.dialog.showSaveDialog(parent, options) : electron_1.dialog.showSaveDialog(options);
}
async function createWindow() {
    log("creating window");
    mainWindow = new electron_1.BrowserWindow({
        width: 1366,
        height: 768,
        minWidth: 980,
        minHeight: 620,
        backgroundColor: "#08a8f3",
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            preload: node_path_1.default.join(__dirname, "preload.js"),
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
    }
    else {
        log("loading production frontend");
        await mainWindow.loadFile(node_path_1.default.resolve(__dirname, "../frontend/index.html"));
    }
}
electron_1.ipcMain.handle("select-audio-directory", async () => {
    const result = await showOpenDialog({
        title: "选择音频文件夹",
        properties: ["openDirectory"]
    });
    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }
    return result.filePaths[0];
});
electron_1.ipcMain.handle("save-config-file", async (_event, config) => {
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
    await node_fs_2.promises.writeFile(result.filePath, JSON.stringify(config, null, 2), "utf8");
    return {
        canceled: false,
        path: result.filePath
    };
});
electron_1.ipcMain.handle("open-config-file", async () => {
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
    const raw = await node_fs_2.promises.readFile(filePath, "utf8");
    return {
        canceled: false,
        path: filePath,
        config: JSON.parse(raw)
    };
});
electron_1.app.whenReady().then(() => {
    log("app ready");
    createWindow().catch((error) => {
        log(`startup error: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
        electron_1.dialog.showErrorBox("启动失败", error instanceof Error ? error.message : String(error));
        electron_1.app.quit();
    });
    electron_1.app.on("activate", () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            void createWindow();
        }
    });
});
electron_1.app.on("before-quit", stopBackend);
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
