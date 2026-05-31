"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AudioService = void 0;
const common_1 = require("@nestjs/common");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"]);
let AudioService = class AudioService {
    async listFiles(directory) {
        if (!directory) {
            return [];
        }
        const resolved = node_path_1.default.resolve(directory);
        const stat = await this.getDirectoryStat(resolved);
        if (!stat) {
            return [];
        }
        const entries = await node_fs_1.promises.readdir(resolved, {
            withFileTypes: true
        });
        const files = [];
        for (const entry of entries) {
            if (!entry.isFile()) {
                continue;
            }
            const ext = node_path_1.default.extname(entry.name).toLowerCase();
            if (!AUDIO_EXTENSIONS.has(ext)) {
                continue;
            }
            const filePath = node_path_1.default.join(resolved, entry.name);
            const fileStat = await node_fs_1.promises.stat(filePath);
            files.push({
                name: entry.name,
                size: fileStat.size
            });
        }
        return files.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    }
    async resolveAudioFile(directory, name) {
        if (!directory || !name) {
            throw new common_1.BadRequestException("音频目录或文件名缺失");
        }
        if (node_path_1.default.basename(name) !== name) {
            throw new common_1.BadRequestException("音频文件名无效");
        }
        const ext = node_path_1.default.extname(name).toLowerCase();
        if (!AUDIO_EXTENSIONS.has(ext)) {
            throw new common_1.BadRequestException("不支持的音频格式");
        }
        const resolvedDirectory = node_path_1.default.resolve(directory);
        const filePath = node_path_1.default.join(resolvedDirectory, name);
        const relative = node_path_1.default.relative(resolvedDirectory, filePath);
        if (relative.startsWith("..") || node_path_1.default.isAbsolute(relative)) {
            throw new common_1.BadRequestException("音频文件路径无效");
        }
        try {
            const stat = await node_fs_1.promises.stat(filePath);
            if (!stat.isFile()) {
                throw new common_1.NotFoundException("音频文件不存在");
            }
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.NotFoundException("音频文件不存在");
        }
        return filePath;
    }
    async getDirectoryStat(directory) {
        try {
            const stat = await node_fs_1.promises.stat(directory);
            return stat.isDirectory() ? stat : null;
        }
        catch {
            return null;
        }
    }
};
exports.AudioService = AudioService;
exports.AudioService = AudioService = __decorate([
    (0, common_1.Injectable)()
], AudioService);
