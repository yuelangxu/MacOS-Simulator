const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf'
};

let server;

function startServer(rootDir) {
  return new Promise((resolve) => {
    server = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/') reqPath = '/index.html';

      const filePath = path.join(rootDir, decodeURIComponent(reqPath));

      fs.readFile(filePath, (err, data) => {
        if (err) {
          fs.readFile(path.join(rootDir, 'index.html'), (err2, data2) => {
            if (err2) {
              res.writeHead(404);
              res.end('Not found');
              return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data2);
          });
          return;
        }

        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': mime[ext] || 'application/octet-stream'
        });
        res.end(data);
      });
    });

    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });
}

async function createWindow() {
  const rootDir = path.join(__dirname, 'web-dist');
  const port = await startServer(rootDir);

  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: '#111111',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadURL(`http://127.0.0.1:${port}`);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (server) server.close();
  if (process.platform !== 'darwin') app.quit();
});
