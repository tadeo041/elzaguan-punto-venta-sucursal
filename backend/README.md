# El Zaguán — Backend

> Servidor local construido con **NestJS** y **SQLite**. Se ejecuta en la caja de cobro para proveer los datos y la lógica de negocio al frontend y, en el futuro, a otros dispositivos en la red local de la sucursal.

## Descripción General

Este backend está diseñado para funcionar como un **"Sidecar"** (proceso secundario) lanzado por Electron. Su función principal es gestionar la base de datos local (SQLite) de la sucursal, manejar la lógica de inventario, ventas y autenticación, y exponer estos datos mediante una API REST.

Aunque en la actualidad la aplicación de escritorio (Electron + Angular) se conecta a este backend usando `localhost`, el servidor está configurado para escuchar en `0.0.0.0`. Esto significa que en el futuro, otros dispositivos en la misma red (como tablets o PCs de la sucursal) podrán consultar la API usando la IP local de la caja de cobro.

## Tecnologías

| Tecnología | Uso |
|------------|-----|
| [NestJS](https://nestjs.com/) | Framework del servidor (Backend) |
| [TypeScript](https://www.typescriptlang.org/) | Lenguaje tipado |
| [TypeORM](https://typeorm.io/) | ORM para manejo de la base de datos |
| [SQLite](https://www.sqlite.org/) | Base de datos local en archivo (sin servidor) |

## Estructura Principal del Proyecto

-   `src/main.ts`: Punto de entrada. Configura CORS, el prefijo global (`/api`) y el puerto de escucha (`3000` en `0.0.0.0`).
-   `src/app.module.ts`: Configuración principal. Aquí se importa `TypeOrmModule` para conectar con la base de datos.
-   `pos-database.sqlite`: Archivo de base de datos (se genera automáticamente al iniciar).

## Instalación y Uso

### 1. Instalar dependencias
```bash
npm install
```

### 2. Modo desarrollo
```bash
npm run start:dev
```

### 3. Modo compiliar para producción
```bash
npm run build
```
Esto generará la carpeta **`dist/.`** Esta carpeta es la que el proceso principal de Electron (**`electron-main.js`**) buscará y ejecutará mediante un proceso secundario cuando la aplicación de escritorio se inicie en la caja de cobro.

