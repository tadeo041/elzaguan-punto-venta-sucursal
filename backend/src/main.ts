import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Tu configuración existente
  app.enableCors();
  app.setGlobalPrefix('api');

  // Configuración de swagger 
  const config = new DocumentBuilder()
    .setTitle('El Zaguán - POS API')
    .setDescription('API para el punto de venta de la sucursal')
    .setVersion('1.0')
    .addTag('users') // Etiqueta para agrupar los endpoints
    .build();
  
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory); // La ruta será /docs

  await app.listen(3000, '0.0.0.0');
  console.log(`Backend corriendo en: ${await app.getUrl()}`);
  console.log(`Swagger disponible en: http://localhost:3000/docs`); // Mensaje de ruta de swagger
}
bootstrap();