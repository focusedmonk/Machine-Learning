const electron = require('electron');
const { app, ipcMain, BrowserWindow, session, dialog } = electron;
const path = require('path');
const fs = require('fs');
const cwd = process.cwd();
const settingsFilepath = path.join(cwd, 'configuration', 'settings.json');

app.on('window-all-closed', () => {
    app.quit();
});

ipcMain.on('get-settings', event => {
    event.returnValue = fs.existsSync(settingsFilepath) ? JSON.parse(String(fs.readFileSync(settingsFilepath))) : {};
});

// Listen for app to be ready
app.on('ready', () => {
    if (!fs.existsSync(settingsFilepath)) {
        dialog.showMessageBox({
            type: 'warning',
            title: 'Message',
            message: 'Settings file not found at the location: ' + settingsFilepath
        }).then(() => {
            app.quit();
        });
        return;
    }
    const settings = JSON.parse(String(fs.readFileSync(settingsFilepath)));
    const cmdLineSwitchArr = settings['CommandLineSwitch'] || [];
    const ajaxRequestHeaders = settings['AjaxHeaders'] && settings['AjaxHeaders'].Request;
    const ajaxResponseHeaders = settings['AjaxHeaders'] && settings['AjaxHeaders'].Response;
    const appHtmlPath = settings['LocalAppDirectory'] || path.join(__dirname, 'readme', 'index.html');
    const { Menu } = electron;
    const menu = Menu.getApplicationMenu();
    const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
    let viewMenu;
    
    // Command line switches
    for (let cmdLineSwitch of cmdLineSwitchArr) {
        app.commandLine.appendSwitch(cmdLineSwitch);
    }

    try {
        viewMenu = menu.items.find(item => item.role === 'viewmenu').submenu.items;
        viewMenu.find(item => item.role === 'toggledevtools').visible = false;
    } catch (e) {
        console.error(e);
    }
    // Setting custom tools menu
    let customMenu = Menu.buildFromTemplate([{
        label: 'View',
        submenu: viewMenu
    }, {
        label: 'Utility',
        submenu: [{
            label: 'Developer Tools',
            click() {
                if (applicationWin.webContents.isDevToolsOpened()) {
                    if (applicationWin.webContents.isDevToolsFocused()) {
                        applicationWin.webContents.closeDevTools();
                    } else {
                        applicationWin.webContents.devToolsWebContents.focus();
                    }
                } else {
                    applicationWin.webContents.openDevTools();
                }
            },
            accelerator: 'F12'
        }]
    }]);
    Menu.setApplicationMenu(customMenu);

    let applicationWin = new BrowserWindow({
        height: height,
        width: width,
        nativeWindowOpen: true,
        webPreferences: {
            webSecurity: false,
            contextIsolation: false,
            allowRunningInsecureContent: true,
            additionalArguments: settings['ElectronCommandLineArgs'] || [],
            // preload: path.join(cwd, '_scripts', 'preload.js')
        }
    });
    applicationWin.maximize();
    if (settings['OpenDevToolsOnAppLaunch']) {
        applicationWin.webContents.openDevTools();
    }
    
	applicationWin.loadURL(`file://${appHtmlPath}`);   

    // Setting headers before request is initiated
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        for (let key in ajaxRequestHeaders) {
            details.requestHeaders[key] = ajaxRequestHeaders[key];
        }
        callback({
            requestHeaders: details.requestHeaders
        })
    });

    // Setting headers after geting the response
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        if (details.responseHeaders['x-frame-options'] || details.responseHeaders['X-Frame-Options']) {
            delete details.responseHeaders['x-frame-options'];
            delete details.responseHeaders['X-Frame-Options'];
        }
        for (let key in ajaxResponseHeaders) {
            details.responseHeaders[key] = ajaxResponseHeaders[key];
        }
        callback({
            cancel: false,
            responseHeaders: details.responseHeaders
        });
    });
});