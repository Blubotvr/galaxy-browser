# Galaxy (Windows desktop app)

Space-themed private browser built with Electron.

## Run from source
    npm install
    npm start

## Build the single Galaxy.exe
    npm run dist
Output: dist/Galaxy.exe (portable, no installer needed to run it).

## Files
- main.js     - app process: private session, tracker blocking, VPN (Proton), Defender download scan
- preload.js  - safe bridge between main.js and the UI
- index.html  - browser UI: tabs, AI panel, music panel
- home.html   - starfield home page with the splash-message search bar
- splash.js   - 49,000+ funny splash messages
- icon.png, build/icon.ico - app icon
