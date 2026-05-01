import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'https://blog-mu-dun-87.vercel.app',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // only if you're using cookies/auth headers
  });
  app.setGlobalPrefix('api');

  // const config = new DocumentBuilder().setTitle('Nest E-Commerce').build();
  // const document = SwaggerModule.createDocument(app, config);
  // app.use(
  //   '/reference',
  //   apiReference({
  //     content: document,
  //   }),
  // );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(process.env.PORT ?? 3000);
  const logger = new Logger('Bootstrap');
  logger.log(`This server runs on http://localhost:${process.env.PORT}`);
}
void bootstrap();
