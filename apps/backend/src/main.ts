import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
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
