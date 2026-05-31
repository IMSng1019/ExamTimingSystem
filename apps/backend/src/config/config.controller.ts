import { Body, Controller, Get, Post, Put } from "@nestjs/common";
import { ConfigService } from "./config.service";

@Controller("config")
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getConfig() {
    return this.configService.getConfig();
  }

  @Put()
  saveConfig(@Body() payload: unknown) {
    return this.configService.saveConfig(payload);
  }

  @Post("validate")
  validateConfig(@Body() payload: unknown) {
    return this.configService.validate(payload);
  }
}
