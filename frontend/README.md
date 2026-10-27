# El Zaguán — Punto de Venta (Sucursal)

> Interfaz de usuario del punto de venta construida con **Angular** y empaquetada para escritorio con **Electron**. 

## Descripción General

Este módulo contiene la interfaz visual que utiliza el cajero en la caja de cobro. Se comunica mediante peticiones HTTP con el backend local (`http://localhost:3000/api`) para consultar productos, registrar ventas y generar reportes.

Electron actúa como el contenedor de la aplicación: se encarga de levantar la ventana nativa de Windows/macOS/Linux y, en modo producción, se encargará también de arrancar el servidor de NestJS en segundo plano.


## Características

- Gestión de inventario y productos
- Administración de clientes
- Reportes de ventas, inventario y propinas 
- Autenticación de usuarios
- Aplicación de escritorio (Windows)

## Tecnologías

| Tecnología | Versión | Uso |
|------------|---------|-----|
| [Angular](https://angular.dev/) | `^20.3.0` | Framework de la interfaz |
| [TypeScript](https://www.typescriptlang.org/) | `~5.9.2` | Lenguaje tipado |
| [RxJS](https://rxjs.dev/) | `~7.8.0` | Programación reactiva |
| [Zone.js](https://github.com/angular/zone.js) | `~0.15.0` | Contexto de cambio de Angular |
| [Electron](https://www.electronjs.org/) | `^44.0.0` | Aplicación de escritorio |
| [electron-builder](https://www.electron.build/) | `^26.15.3` | Empaquetado y distribución |
| [Angular CLI](https://angular.dev/tools/cli) | `^20.3.3` | Herramientas de Angular |
| [Karma](https://karma-runner.github.io/) + [Jasmine](https://jasmine.github.io/) | `~6.4.0` / `~5.9.0` | Pruebas unitarias |
| [Prettier](https://prettier.io/) | (config en `package.json`) | Formato de código |
| [concurrently](https://www.npmjs.com/package/concurrently) | `^10.0.5` | Ejecutar varios scripts a la vez |
| [cross-env](https://www.npmjs.com/package/cross-env) | `^10.1.0` | Variables de entorno multiplataforma |
| [wait-on](https://www.npmjs.com/package/wait-on) | `^9.1.0` | Esperar a que el dev server esté listo |

## Requisitos previos

Antes de iniciar el frontend, asegúrate de tener el **backend de NestJS corriendo** en el puerto `3000`, de lo contrario las peticiones HTTP fallarán.

## Instalación


### 1. Cambiar a la rama de desarrollo

```bash
git checkout develop
```

### 2. Instalar dependencias

```bash
npm install
```

---

## Uso 

### Modo desarrollo (Angular + Electron juntos)

```bash
npm run electron:dev
```
Este comando:
1. Levanta el servidor de Angular en http://localhost:4200.
2. Espera a que esté listo (wait-on).
3. Abre la ventana de Electron apuntando a ese servidor.