import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common'; // <-- 1. Importar
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Elimina propiedades que no estén en el DTO
    forbidNonWhitelisted: true, // Lanza error si envían propiedades extra
    transform: true, // Transforma los datos al tipo del DTO (ej. string a number)
  }));

  const config = new DocumentBuilder()
    .setTitle('El Zaguán - POS API')
    .setDescription('API para el punto de venta de la sucursal')
    .setVersion('1.0')
    .addTag('users')
    .addTag('auth')
    .addTag('tips')
    .addBearerAuth()
    .build();
  
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  await app.listen(3000, '0.0.0.0');
  console.log(`Backend corriendo en: ${await app.getUrl()}`);
  console.log(`Swagger disponible en: http://localhost:3000/docs`);
}
bootstrap();