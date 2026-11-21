const { app, BrowserWindow, session } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

let backendProcess = null;

function startBackend() {
  const isDev = process.env.NODE_ENV === 'development';

  // En producción: resources/backend/main.js (lo copia electron-builder)
  // En dev: backend/dist/main.js
  const backendPath = isDev
    ? path.join(__dirname, '..', 'backend', 'dist', 'main.js')
    : path.join(process.resourcesPath, 'backend', 'main.js');

  // Ruta escribible para la DB
  const dbPath = isDev
    ? path.join(__dirname, '..', 'backend', 'pos-database.sqlite')
    : path.join(app.getPath('userData'), 'pos-database.sqlite');

  // Asegurar que exista la carpeta
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  backendProcess = spawn(process.execPath, [backendPath], {
    cwd: path.dirname(backendPath),
    stdio: 'inherit',
    env: {
      ...process.env,
      DB_PATH: dbPath,
      NODE_ENV: isDev ? 'development' : 'production',
      ELECTRON_RUN_AS_NODE: '1',
    },
  });

  backendProcess.on('error', (err) => console.error('Backend error:', err));
}

function configurarDescargas() {
  session.defaultSession.on('will-download', (event, item) => {
    const savePath = path.join(app.getPath('downloads'), item.getFilename());
    item.setSavePath(savePath);

    item.once('done', (event, state) => {
      if (state === 'completed') {
        console.log('Descarga completada:', savePath);
      } else {
        console.log('Descarga fallida:', state);
      }
    });
  });
}

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'El Zaguán - Punto de Venta',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'public', 'logoAplicacion.png'),
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:4200');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist/elzaguan-punto-venta-sucursal/browser/index.html'));
    win.webContents.openDevTools();
  }
};

app.on('ready', () => {
  configurarDescargas();
  startBackend();
  createWindow();
});

app.on('will-quit', () => {
  if (backendProcess) backendProcess.kill();
});