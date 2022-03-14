const {
	app,
	BrowserWindow,
	screen,
	Tray,
	Menu,
	nativeImage,
	ipcMain,
} = require("electron");
const { attach, detach, refresh } = require("electron-as-wallpaper");
const URL = require("url").URL;
const { Blob } = require("node:buffer");
const fs = require("fs");
const path = require("path");
const { fileURLToPath, pathToFileURL } = require("url");

let runPoint =
	__dirname.indexOf("resources") >= 0
		? __dirname.split("resources")[0]
		: __dirname;

if (!fs.existsSync(path.join(runPoint, "./settings.json")))
	fs.writeFileSync(
		path.join(runPoint, "./settings.json"),
		JSON.stringify(
			{
				backgroundDelay: 10,
				finishBeforeNext: false,
			},
			null,
			"\t"
		)
	);

let isQuitting = false;
/** @type {BrowserWindow[]} */
const windows = [];

function loadBackgrounds() {
	screen.getAllDisplays().forEach(async (display, i) => {
		var win = new BrowserWindow({
			enableLargerThanScreen: true,
			autoHideMenuBar: true,
			frame: false,
			show: false,
			webPreferences: {
				backgroundThrottling: false,
				nodeIntegration: true,
				preload: __dirname + "\\mainBackground.js",
			},
			skipTaskbar: true,
			title: "Live Backgrounds Display " + (i + 1),
		});
		win.setBounds(display.bounds);
		await win.loadFile(__dirname + "/src/index.html");
		try {
			attach(win);
			win.show();
		} catch (e) {
			console.log(e);
		}
		windows.push(win);
		win.on("close", () => {
			windows.splice(windows.indexOf(win), 1);
		});
	});
}

screen.on("display-metrics-changed", () => reloadBackgrounds());
screen.on("display-added", () => reloadBackgrounds());
screen.on("display-removed", () => reloadBackgrounds());

ipcMain.on("updateSettings", function (_, Settings) {
	fs.writeFileSync(
		path.join(runPoint, "./settings.json"),
		JSON.stringify(Settings, null, "\t")
	);
});

ipcMain.on("openFolderLocation", function () {
	require("child_process").exec(
		'explorer.exe "' + path.join(runPoint, "./wallpapers/") + '"'
	);
});

ipcMain.handle("getSettings", (event) => {
	event.returnValue = JSON.parse(
		fs.readFileSync(path.join(runPoint, "./settings.json"))
	);
	return JSON.parse(fs.readFileSync(path.join(runPoint, "./settings.json")));
});

ipcMain.handle("getWallpapers", (event) => {
	if (!fs.existsSync(path.join(runPoint, "./wallpapers")))
		fs.mkdirSync(path.join(runPoint, "./wallpapers"), {
			recursive: true,
		});
	var wallpapers = [];
	fs.readdirSync(path.join(runPoint, "./wallpapers")).forEach((file) => {
		var ext = file.split(".").pop().toLowerCase();
		if (
			![
				"mov",
				"wmv",
				"flv",
				"avi",
				"webm",
				"mkv",
				"ogg",
				"m4p",
				"m4v",
				"qt",
				"swf",
				"avchd",
			].includes(ext) &&
			!ext.startsWith("mp")
		)
			return;
		wallpapers.push(path.join(runPoint, "./wallpapers/", file));
	});
	event.returnValue = wallpapers;
	return wallpapers;
});

ipcMain.handle("checkWallpapers", (event) => {
	if (!fs.existsSync(path.join(runPoint, "./wallpapers")))
		fs.mkdirSync(path.join(runPoint, "./wallpapers"), {
			recursive: true,
		});
	var check =
		fs.readdirSync(path.join(runPoint, "./wallpapers")).filter((file) => {
			var ext = file.split(".").pop().toLowerCase();
			return (
				[
					"mov",
					"wmv",
					"flv",
					"avi",
					"webm",
					"mkv",
					"ogg",
					"m4p",
					"m4v",
					"qt",
					"swf",
					"avchd",
				].includes(ext) || ext.startsWith("mp")
			);
		}).length > 0;
	event.returnValue = check;
	return check;
});

function reloadBackgrounds() {
	windows.forEach((window) => window.close());
	while (windows.length > 0) windows.shift();
	loadBackgrounds();
}

app.whenReady().then(async () => {
	reloadBackgrounds();

	const tray = new Tray(require("path").join(__dirname, "./icon.png"));

	tray.setContextMenu(
		Menu.buildFromTemplate([
			{
				label: "Open",
				click: function () {
					settingWindow.show();
				},
			},
			{
				label: "Quit",
				click: function () {
					isQuitting = true;
					app.quit();
					process.exit();
				},
			},
		])
	);

	tray.setToolTip("Live Background");

	tray.on("click", () => {
		tray.popUpContextMenu();
	});

	const settingWindow = new BrowserWindow({
		height: screen.getAllDisplays()[0].bounds.height / 1.5,
		width: screen.getAllDisplays()[0].bounds.width / 3,
		resizable: false,
		show: false,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
		},
		backgroundColor: "#333",
		autoHideMenuBar: true,
		frame: false,
		maximizable: false,
	});

	await settingWindow.loadFile(__dirname + "/src/settings.html");

	settingWindow.show();

	settingWindow.on("close", (event) => {
		if (!isQuitting) {
			event.preventDefault();
			settingWindow.hide();
			event.returnValue = false;
		}
	});
	settingWindow.on("minimize", () => {
		reloadBackgrounds();
		settingWindow.restore();
	});

	ipcMain.on("reload", () => reloadBackgrounds());
});

app.on("window-all-closed", () => {
	process.exit();
});
