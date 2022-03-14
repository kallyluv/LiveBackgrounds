let { ipcRenderer } = require("electron");
window.ipcRenderer = ipcRenderer;
(async () => {
	/** @type {HTMLInputElement} */
	let finishCheckbox = document.querySelector("#finishBeforeNext #value");
	/** @type {HTMLInputElement} */
	let delayInput = document.querySelector("#timeBetweenChanges #value");
	/**
	 * @type {{backgroundDelay: number, finishBeforeNext: boolean}}
	 */
	ipcRenderer.invoke("getSettings").then((Settings) => {
		window.Settings = Settings;
		delayInput.value = Settings.backgroundDelay;
		finishCheckbox.checked = Settings.finishBeforeNext;
	});
	document.querySelector("#close").addEventListener("click", () => {
		window.close();
	});
	document.querySelector("#save").addEventListener("click", () => {
		Settings.backgroundDelay = parseInt(delayInput.value);
		Settings.finishBeforeNext = finishCheckbox.checked;
		ipcRenderer.send("updateSettings", Settings);
		ipcRenderer.send("reload");
	});
	setTimeout(() => {
		ipcRenderer.invoke("checkWallpapers").then((check) => {
			if (!check) {
				ipcRenderer.send("openFolderLocation");
				alert(
					"No valid wallpapers found! Please add some videos to the wallpapers folder!"
				);
			}
		});
	});
})();

function openFolderLocation() {
	ipcRenderer.send("openFolderLocation");
}
