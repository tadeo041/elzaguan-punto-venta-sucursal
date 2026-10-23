# El Zaguán — Punto de Venta (Sucursal)

> Sistema de punto de venta de escritorio para sucursal de El Zaguán, construido con **Angular + Electron**.

## Tabla de contenido

1. [Descripción](#-descripción)
2. [Características](#-características)
3. [Tecnologías](#-tecnologías)
4. [Requisitos previos](#-requisitos-previos)
5. [Instalación](#-instalación)
6. [Uso](#-uso)

---

## Descripción

**El Zaguán Punto de Venta (Sucursal)** es una aplicación de escritorio
para gestionar las operaciones diarias de una sucursal: inventario,
clientes, propina y reportes .

Está construida con **Angular** (interfaz) y **Electron** (empaquetado como
aplicación de escritorio multiplataforma).

---

## Características

- Gestión de inventario y productos
- Administración de clientes
- Reportes de ventas, inventario y propinas 
- Autenticación de usuarios
- Aplicación de escritorio (Windows, macOS, Linux)

---

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

---

## Requisitos previos

- **Node.js** `>= 20.x` (recomendado para Angular 20)
- **npm** `>= 10.x`
- **Git** `>= 2.x`

Verifica las versiones:

```bash
node --version
npm --version
git --version
```

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tadeo041/elzaguan-punto-venta-sucursal.git
cd elzaguan-punto-venta-sucursal
```
### 2. Cambiar a la rama de desarrollo

```bash
git checkout develop
```
### 3. Instalar dependencias

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

---