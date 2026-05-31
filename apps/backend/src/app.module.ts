import { Module } from "@nestjs/common";
import { AudioController } from "./audio/audio.controller";
import { AudioService } from "./audio/audio.service";
import { ConfigController } from "./config/config.controller";
import { ConfigService } from "./config/config.service";

@Module({
  controllers: [ConfigController, AudioController],
  providers: [ConfigService, AudioService]
})
export class AppModule {}
