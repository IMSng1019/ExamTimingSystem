"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ["error", "warn", "log"]
    });
    app.enableCors({
        origin: true
    });
    app.setGlobalPrefix("api");
    const port = Number(process.env.PORT ?? 3099);
    await app.listen(port, "127.0.0.1");
}
void bootstrap();
