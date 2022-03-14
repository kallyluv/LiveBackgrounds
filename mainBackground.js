const { ipcRenderer } = require("electron");
window.ipcRenderer = ipcRenderer;
(async () => {
	/** @type {HTMLVideoElement[]} */
	const videoElements = [];
	/** @type {HTMLVideoElement} */
	let activeBackground = null;
	window.videoElements = videoElements;
	window.activeBackground = activeBackground;
	window.addEventListener("DOMContentLoaded", async () => {
		/**
		 * @type {{backgroundDelay: number, finishBeforeNext: boolean}}
		 */
		const Settings = await ipcRenderer.invoke("getSettings");
		window.Settings = Settings;
		(await ipcRenderer.invoke("getWallpapers")).forEach((file) => {
			var elm = document.createElement("video");
			elm.src = file;
			if (!activeBackground) {
				activeBackground = elm;
				elm.style.opacity = 1;
				if (Settings.finishBeforeNext) {
					activeBackground.addEventListener("ended", () => {
						var index = videoElements.indexOf(activeBackground);
						if (videoElements[index + 1])
							fadeBackground(videoElements[index + 1]);
						else fadeBackground(videoElements[0]);
					});
				} else {
					activeBackground.addEventListener("ended", function () {
						this.play();
					});
				}
				activeBackground.play();
			}
			elm.style.transition = "2s ease all";
			videoElements.push(elm);
			document.documentElement.appendChild(elm);
		});
		if (videoElements.length < 1) {
			window.close();
			return;
		}
		/**
		 *
		 * @param {HTMLVideoElement} to
		 */
		function fadeBackground(to) {
			videoElements.forEach((elm) => {
				if (elm != to) elm.style.opacity = 0;
			});
			to.style.opacity = 1;
			to.play();
			activeBackground = to;
			if (Settings.finishBeforeNext) {
				activeBackground.addEventListener("ended", () => {
					var index = videoElements.indexOf(activeBackground);
					if (videoElements[index + 1])
						fadeBackground(videoElements[index + 1]);
					else fadeBackground(videoElements[0]);
				});
			} else {
				activeBackground.addEventListener("ended", function () {
					this.play();
				});
			}
		}
		if (!Settings.finishBeforeNext)
			setInterval(() => {
				var index = videoElements.indexOf(activeBackground);
				if (videoElements[index + 1])
					fadeBackground(videoElements[index + 1]);
				else fadeBackground(videoElements[0]);
			}, Settings.backgroundDelay * 1000);
	});
})();
