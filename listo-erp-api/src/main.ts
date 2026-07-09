import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import { I18nMiddleware, I18nService } from 'nestjs-i18n';
import { I18nResponseInterceptor } from './common/interceptors/i18n-response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(I18nMiddleware);

  app.useGlobalInterceptors(new I18nResponseInterceptor(app.get(I18nService)));

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Listo ERP API')
    .setDescription('API para sistema ERP multi-empresa')
    .setVersion('1.0')
    .addBearerAuth()
    .addGlobalParameters({
      name: 'Accept-Language',
      in: 'header',
      description: 'Idioma preferido para las respuestas (es, en, pt, zh)',
      required: false,
      schema: {
        type: 'string',
        default: 'es',
        enum: ['es', 'en', 'pt', 'zh'],
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `🚀 Servidor corriendo en http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(
    `📚 Documentación Swagger en http://localhost:${process.env.PORT ?? 3000}/api`,
  );
}

void bootstrap();
