# El Zaguán — Punto de Venta (Sucursal)

> Sistema de punto de venta de escritorio (POS) diseñado para operar como el servidor local de cada sucursal de El Zaguán. Construido con una arquitectura desacoplada: **Angular + Electron** para el frontend y **NestJS + SQLite** para el backend.

## Descripción General

Esta aplicación está diseñada para instalarse en la **caja de cobro** de cada sucursal. Actúa como un sistema "todo en uno": abre la interfaz gráfica para el cajero y levanta un servidor local en segundo plano. 

La caja de cobro funcionará de manera 100% online, pero en el futuro permitirá que otros dispositivos de la sucursal (tablets, otras PCs) se conecten a la base de datos local a través de la red.

## Arquitectura del Proyecto (Monorepo)

El proyecto está dividido en dos grandes aplicaciones que se empaquetan juntas gracias a Electron:

*  **`/frontend-angular`**: La interfaz de usuario (Angular) empaquetada como aplicación de escritorio con Electron.
* **`/backend-nest`**: El servidor local (NestJS) que maneja la lógica de negocio y se comunica con la base de datos SQLite.

## Requisitos Previos

- **Node.js** `>= 24.22.1 (LTS)` 
- **npm** `>= 11.4.1`
- **Git** `>= 2.48.1`

## Instalación y Configuración (Entorno de Desarrollo)

Para empezar a trabajar en el proyecto completo, sigue estos pasos:

### 1. Clonar el repositorio principal

```bash
git clone https://github.com/tadeo041/elzaguan-punto-venta-sucursal.git
cd elzaguan-punto-venta-sucursal
```

### 2. Instalar dependencias del Backend
```bash
cd backend-nest
npm install
```
### 3. Instalar dependencias del Frontend
```bash
cd ../frontend-angular
npm install
```

### 4. Levantar el sistema en desarrollo

Para probar todo el sistema junto, necesitas dos terminales: 

#### Terminal 1 (Backend):

```bash
cd backend-nest
npm run start:dev
```

#### Terminal 2 (Frontend + Electron):

```bash
cd frontend-angular
npm run electron:dev
```
## Documentación Detallada

Para más información sobre cada parte del sistema, consulta los READMEs específicos:

* Documentación del Frontend
* Documentación del Backend