const { app, BrowserWindow, ipcMain, dialog, shell, session, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { execFile, exec } = require('child_process');

let win;
const cfgFile = () => path.join(app.getPath('userData'), 'galaxy-config.json');

function createWindow() {
  win = new BrowserWindow({
    width: 1360, height: 840, minWidth: 760, minHeight: 480,
    backgroundColor: '#0b0d21', title: 'Galaxy', icon: path.join(__dirname, 'icon.png'), autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true, contextIsolation: true, nodeIntegration: false,
    },
  });
  win.loadFile('index.html');
}

// Links that try to open a new window become new Galaxy tabs.
app.on('web-contents-created', (_e, contents) => {
  if (contents.getType() === 'webview') {
    contents.setWebRTCIPHandlingPolicy('disable_non_proxied_udp');   // no WebRTC IP leaks
    contents.setWindowOpenHandler(({ url }) => {
      if (win && !win.isDestroyed()) win.webContents.send('open-tab', url);
      return { action: 'deny' };
    });
  }
});


// ---------- Download virus scan (Windows Defender, built into Windows - free) ----------
function defenderPath() {
  const pf = process.env.ProgramFiles;
  if (pf) { const p = path.join(pf, 'Windows Defender', 'MpCmdRun.exe'); if (fs.existsSync(p)) return p; }
  const pd = process.env.ProgramData;
  if (pd) {
    const base = path.join(pd, 'Microsoft', 'Windows Defender', 'Platform');
    try {
      for (const v of fs.readdirSync(base).sort().reverse()) {
        const p = path.join(base, v, 'MpCmdRun.exe');
        if (fs.existsSync(p)) return p;
      }
    } catch (_) {}
  }
  return null;
}
function scanFile(file) {   // -> 'clean' | 'infected' | 'unavailable'
  return new Promise((resolve) => {
    const exe = defenderPath();
    if (!exe) return resolve('unavailable');
    execFile(exe, ['-Scan', '-ScanType', '3', '-File', file, '-DisableRemediation'],
      { timeout: 300000, windowsHide: true }, (err, so, se) => {
        const out = ((so || '') + (se || '')).toLowerCase();
        if (!err) return resolve('clean');
        if (err.code === 2 || (out.includes('threat') && !out.includes('no threats'))) return resolve('infected');
        resolve('unavailable');
      });
  });
}
function uniquePath(dir, name) {
  const ext = path.extname(name), base = path.basename(name, ext);
  let p = path.join(dir, name), n = 1;
  while (fs.existsSync(p)) p = path.join(dir, `${base} (${n++})${ext}`);
  return p;
}
function handleDownload(_e, item) {
  const send = (m) => { if (win && !win.isDestroyed()) win.webContents.send('status', m); };
  const name = path.basename(item.getFilename() || 'download').replace(/[<>:"/\\|?*]/g, '_');
  const dir = path.join(app.getPath('temp'), 'galaxy-scan');
  fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, Date.now() + '-' + name);
  item.setSavePath(tmp);                      // download to a quarantine folder first
  send('\u2B07 Downloading ' + name + '...');
  item.on('updated', (_ev, state) => {
    const total = item.getTotalBytes();
    if (state === 'progressing' && total > 0) send('\u2B07 ' + name + ': ' + Math.round((item.getReceivedBytes() / total) * 100) + '%');
  });
  item.once('done', async (_ev, state) => {
    const cleanup = () => { try { fs.unlinkSync(tmp); } catch (_) {} };
    if (state !== 'completed') { cleanup(); return send('Download ' + state + ': ' + name); }
    send('\uD83D\uDEE1 Scanning ' + name + ' for viruses...');
    let result = await scanFile(tmp);
    if (!fs.existsSync(tmp)) result = 'infected';   // Defender already removed it
    if (result === 'infected') {
      cleanup();
      send('\u26A0 Virus found - ' + name + ' was deleted.');
      return dialog.showMessageBox(win, {
        type: 'warning', title: 'Galaxy blocked a download', message: 'Threat detected in "' + name + '".',
        detail: 'The file was deleted and was never saved to your computer.',
      });
    }
    if (result === 'unavailable') {
      const { response } = await dialog.showMessageBox(win, {
        type: 'question', title: 'Galaxy could not scan this file',
        message: 'Windows Defender is not available, so "' + name + '" could not be scanned.',
        detail: 'Do you want to keep it anyway? Only keep files you trust.',
        buttons: ['Delete it', 'Keep it anyway'], defaultId: 0, cancelId: 0, noLink: true,
      });
      if (response === 0) { cleanup(); return send('Deleted unscanned file: ' + name); }
    }
    try {
      const dest = uniquePath(app.getPath('downloads'), name);
      await fs.promises.copyFile(tmp, dest);
      cleanup();
      send((result === 'clean' ? '\u2705 ' + name + ' is clean' : '\u26A0 ' + name + ' (unscanned)') + ' - saved to Downloads');
    } catch (_) { send('Could not save ' + name); }
  });
}

const TRACKERS = ['google-analytics.com', 'googletagmanager.com', 'doubleclick.net', 'googlesyndication.com',
  'googleadservices.com', 'connect.facebook.net', 'facebook.net', 'scorecardresearch.com', 'hotjar.com',
  'segment.io', 'segment.com', 'mixpanel.com', 'amazon-adsystem.com', 'taboola.com', 'outbrain.com',
  'criteo.com', 'quantserve.com', 'adnxs.com', 'pubmatic.com', 'rubiconproject.com', 'clarity.ms',
  'fullstory.com', 'mouseflow.com', 'crazyegg.com', 'bat.bing.com', 'ads-twitter.com', 'analytics.tiktok.com'];


// ---------- Virus scan before downloads (Microsoft Defender, built into Windows - free) ----------
const tell = (msg) => { if (win && !win.isDestroyed()) win.webContents.send('status', msg); };

function defenderPath() {
  const pf = process.env.ProgramFiles, pd = process.env.ProgramData;
  const list = [];
  if (pd) {
    const plat = path.join(pd, 'Microsoft', 'Windows Defender', 'Platform');
    try {
      fs.readdirSync(plat).sort().reverse().forEach((v) => list.push(path.join(plat, v, 'MpCmdRun.exe')));
    } catch (_) {}
  }
  if (pf) list.push(path.join(pf, 'Windows Defender', 'MpCmdRun.exe'));
  return list.find((p) => fs.existsSync(p)) || null;
}

// Resolves 'clean' | 'infected' | 'unavailable'
function scanFile(file) {
  return new Promise((resolve) => {
    const exe = defenderPath();
    if (!exe) return resolve('unavailable');
    execFile(exe, ['-Scan', '-ScanType', '3', '-File', file, '-DisableRemediation'],
      { timeout: 5 * 60 * 1000, windowsHide: true }, (err) => {
        if (!fs.existsSync(file)) return resolve('infected');     // Defender removed it
        if (!err) return resolve('clean');                        // exit code 0
        resolve(err.code === 2 ? 'infected' : 'unavailable');     // 2 = threat found
      });
  });
}

function uniquePath(dir, name) {
  const ext = path.extname(name), base = path.basename(name, ext);
  let p = path.join(dir, name), n = 1;
  while (fs.existsSync(p)) p = path.join(dir, `${base} (${n++})${ext}`);
  return p;
}

function setupDownloadScanning(ses) {
  ses.on('will-download', (_event, item) => {
    const name = path.basename(item.getFilename() || 'download');
    const quarantine = path.join(app.getPath('temp'), 'galaxy-scan');
    fs.mkdirSync(quarantine, { recursive: true });
    const tmp = path.join(quarantine, Date.now() + '-' + name);
    item.setSavePath(tmp);                                   // nothing reaches your folders until scanned
    tell(`Downloading ${name}...`);
    item.once('done', async (_e, state) => {
      if (state !== 'completed') {
        fs.rm(tmp, { force: true }, () => {});
        return tell(`Download of ${name} ${state === 'cancelled' ? 'was cancelled' : 'failed'}.`);
      }
      tell(`\uD83D\uDEE1 Scanning ${name} for viruses...`);
      const result = await scanFile(tmp);
      if (result === 'infected') {
        fs.rm(tmp, { force: true }, () => {});
        tell(`\u26A0 ${name} was blocked and deleted - a threat was found.`);
        return dialog.showMessageBox(win, {
          type: 'error', title: 'Galaxy blocked a download',
          message: `${name} contains a threat.`,
          detail: 'The file was deleted and was never saved to your computer.',
        });
      }
      if (result === 'unavailable') {
        const { response } = await dialog.showMessageBox(win, {
          type: 'warning', title: 'Galaxy could not scan this file',
          message: `Galaxy couldn't scan ${name}.`,
          detail: 'Microsoft Defender is unavailable (another antivirus may be handling protection). ' +
                  'Keep the file anyway?',
          buttons: ['Delete it', 'Keep it anyway'], defaultId: 0, cancelId: 0, noLink: true,
        });
        if (response === 0) { fs.rm(tmp, { force: true }, () => {}); return tell(`${name} was deleted (not scanned).`); }
      }
      try {
        const dest = uniquePath(app.getPath('downloads'), name);
        fs.copyFileSync(tmp, dest);
        fs.rmSync(tmp, { force: true });
        tell(result === 'clean' ? `\u2705 ${name} is clean - saved to Downloads.` : `${name} saved to Downloads (not scanned).`);
        shell.showItemInFolder(dest);
      } catch (e) {
        tell(`Could not save ${name}: ${e.message}`);
      }
    });
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  // PRIVATE MODE: this session has no "persist:" prefix, so it lives only in memory.
  // No history, cookies, cache or logins are ever written to disk; it all vanishes when Galaxy closes.
  const ses = session.fromPartition('galaxy-private');
  ses.setUserAgent(ses.getUserAgent().replace(/\s(Electron|galaxy)\/\S+/gi, ''));
  ses.setSpellCheckerEnabled(false);
  ses.on('will-download', handleDownload);
  ses.setPermissionRequestHandler((_wc, perm, cb) => cb(['fullscreen', 'clipboard-sanitized-write'].includes(perm)));
  ses.setPermissionCheckHandler((_wc, perm) => ['fullscreen', 'clipboard-sanitized-write'].includes(perm));
  ses.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*'] }, (d, cb) => {
    try {
      const h = new URL(d.url).hostname;
      cb({ cancel: TRACKERS.some((t) => h === t || h.endsWith('.' + t)) });
    } catch (_) { cb({}); }
  });
  ses.webRequest.onBeforeSendHeaders((d, cb) => {
    d.requestHeaders['Sec-GPC'] = '1';   // "do not sell/share my data"
    d.requestHeaders['DNT'] = '1';
    cb({ requestHeaders: d.requestHeaders });
  });
  setupDownloadScanning(ses);
  createWindow();
});
app.on('window-all-closed', () => app.quit());

// ---------- config ----------
ipcMain.handle('home-url', () => pathToFileURL(path.join(__dirname, 'home.html')).href);

ipcMain.handle('cfg-load', () => {
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(cfgFile(), 'utf8')); } catch (_) {}
  cfg.tracks = (cfg.tracks || [])
    .filter((t) => t && t.path && fs.existsSync(t.path))
    .map((t) => ({ path: t.path, name: path.basename(t.path), url: pathToFileURL(t.path).href }));
  return cfg;
});

ipcMain.handle('cfg-save', (_e, cfg) => {
  try {
    fs.mkdirSync(path.dirname(cfgFile()), { recursive: true });
    const slim = { ...cfg, tracks: (cfg.tracks || []).map((t) => ({ path: t.path })) };
    fs.writeFileSync(cfgFile(), JSON.stringify(slim));
  } catch (_) {}
});

ipcMain.handle('music-add', async () => {
  const r = await dialog.showOpenDialog(win, {
    title: 'Add music', defaultPath: app.getPath('music'),
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'] }],
  });
  if (r.canceled) return [];
  return r.filePaths.map((p) => ({ path: p, name: path.basename(p), url: pathToFileURL(p).href }));
});

// ---------- VPN (Proton VPN Free: free, no data cap, audited strict no-logs policy) ----------
function protonPath() {
  const pf = process.env.ProgramFiles, pf86 = process.env['ProgramFiles(x86)'], la = process.env.LOCALAPPDATA;
  const c = [
    pf && path.join(pf, 'Proton', 'VPN', 'ProtonVPN.Launcher.exe'),
    pf && path.join(pf, 'Proton', 'VPN', 'ProtonVPN.exe'),
    la && path.join(la, 'Programs', 'Proton', 'VPN', 'ProtonVPN.Launcher.exe'),
    la && path.join(la, 'Programs', 'Proton', 'VPN', 'ProtonVPN.exe'),
    pf86 && path.join(pf86, 'Proton Technologies', 'ProtonVPN', 'ProtonVPN.exe'),
  ].filter(Boolean);
  return c.find((p) => fs.existsSync(p)) || null;
}
function wingetHasProton() {
  return new Promise((resolve) => {
    execFile('winget', ['list', '--id', 'Proton.ProtonVPN', '-e', '--accept-source-agreements'],
      { timeout: 25000, windowsHide: true }, (err) => resolve(!err));
  });
}
ipcMain.handle('vpn-status', () => (protonPath() ? 'ready' : 'missing'));

ipcMain.handle('vpn-toggle', async () => {
  const exe = protonPath();
  if (exe) {
    require('child_process').spawn(exe, [], { detached: true, stdio: 'ignore' }).unref();
    return 'ready';
  }
  if (await wingetHasProton()) {
    await dialog.showMessageBox(win, {
      type: 'info', title: 'Proton VPN', message: 'Proton VPN is installed.',
      detail: 'Open it from the Start menu, sign in with your free Proton account, and press Connect.',
    });
    return 'ready';
  }
  // Galaxy ALWAYS asks before installing anything.
  const { response } = await dialog.showMessageBox(win, {
    type: 'question', title: 'Galaxy needs your permission',
    message: 'Galaxy wants to install Proton VPN Free.',
    detail: 'Free, no data limit, and a strict audited no-logs policy. It installs through Windows ' +
            'Package Manager (winget) and a window will show progress. You will need a free Proton account.' +
            '\n\nInstall it now?',
    buttons: ['Yes, install it', 'No'], defaultId: 1, cancelId: 1, noLink: true,
  });
  if (response === 0) {
    exec('start "Galaxy - installing Proton VPN" cmd /k winget install --id Proton.ProtonVPN -e ' +
         '--accept-package-agreements --accept-source-agreements');
    return 'installing';
  }
  return 'missing';
});
