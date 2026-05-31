import { Controller, Get, Query, Res } from "@nestjs/common";
import { AudioService } from "./audio.service";

@Controller("audio")
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Get("files")
  listFiles(@Query("directory") directory = "") {
    return this.audioService.listFiles(directory);
  }

  @Get("file")
  async streamFile(@Query("directory") directory = "", @Query("name") name = "", @Res() response: any) {
    const filePath = await this.audioService.resolveAudioFile(directory, name);
    return response.sendFile(filePath);
  }
}
