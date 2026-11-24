const { app, BrowserWindow, session } = require('electron');
const path = require('path');

app.disableHardwareAcceleration(); 
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('no-sandbox');

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
  }
};

app.on('ready', () => {
  configurarDescargas();
  createWindow();
});