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
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@exam-countdown/shared");
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const config_validation_1 = require("./config.validation");
let ConfigService = class ConfigService {
    dataDir = process.env.EXAM_COUNTDOWN_DATA_DIR ?? node_path_1.default.resolve(process.cwd(), "data");
    configPath = node_path_1.default.join(this.dataDir, "config.json");
    async getConfig() {
        await this.ensureConfigFile();
        const raw = await node_fs_1.promises.readFile(this.configPath, "utf8");
        const parsed = JSON.parse(raw);
        const validation = (0, config_validation_1.validateExamConfigPayload)(parsed);
        if (!validation.ok) {
            const fallback = (0, shared_1.createDefaultExamConfig)();
            await this.writeConfig(fallback);
            return fallback;
        }
        return validation.config;
    }
    async saveConfig(payload) {
        const validation = (0, config_validation_1.validateExamConfigPayload)(payload);
        if (!validation.ok) {
            throw new common_1.BadRequestException({
                message: "配置无效",
                errors: validation.errors
            });
        }
        await this.writeConfig(validation.config);
        return validation.config;
    }
    validate(payload) {
        return (0, config_validation_1.validateExamConfigPayload)(payload);
    }
    async ensureConfigFile() {
        await node_fs_1.promises.mkdir(this.dataDir, {
            recursive: true
        });
        try {
            await node_fs_1.promises.access(this.configPath);
        }
        catch {
            await this.writeConfig((0, shared_1.createDefaultExamConfig)());
        }
    }
    async writeConfig(config) {
        await node_fs_1.promises.mkdir(this.dataDir, {
            recursive: true
        });
        await node_fs_1.promises.writeFile(this.configPath, JSON.stringify(config, null, 2), "utf8");
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)()
], ConfigService);
