import { snapdom } from "https://esm.sh/@zumer/snapdom@2.0.2 ";
import { getData } from "./api.js";

if (document.location.host === "explodingcamera.github.io") {
	document.location = "https://lastfm-iceberg.dawdle.space";
}

const downloadJPG = () => {
	const el = document.getElementById("results");

	snapdom(el, { scale: 2 }).then((result) =>
		result.download({ format: "jpg", filename: "lastfm-iceberg" }),
	);
};

const showScreen = (id) => {
	for (const screen of document.getElementsByClassName("screen"))
		screen.classList.toggle("active", screen.id === id);
};

const setError = (error) => {
	document.getElementById("submit").disabled = false;
	document.getElementById("error").innerHTML =
		`Error: ${error}.\nTry disabling adblockers and refreshing the page, some adblockers block the last.fm API.`;
	document.getElementById("error").style.display = "block";
	showScreen("form-screen");
};

const setSubmitted = () => {
	document.getElementById("submit").disabled = true;
	document.getElementById("error").style.display = "none";
	showScreen("loading-screen");
};

const setSuccess = () => {
	document.getElementById("submit").disabled = false;
	showScreen("result-screen");
};

const handleBack = () => {
	showScreen("form-screen");
};

const handleSubmit = async (e) => {
	e.preventDefault();
	setSubmitted();

	const results = document.getElementsByClassName("result");

	for (const result of results) result.innerHTML = "";

	const options = Object.fromEntries(
		new FormData(document.getElementById("form")).entries(),
	);

	let data;
	try {
		data = await getData(options);
	} catch (error) {
		setError(error.message);
		return;
	}

	data = data.sort((x, y) => x[1] - y[1]).reverse();

	const listeners = data.map((x) => x[1]);
	const minListeners = Math.min(...listeners);
	const maxListeners = Math.max(...listeners);
	const listenerRange = maxListeners - minListeners;
	const maxTier = results.length - 1;

	data = data.map((x, i) => {
		const rankRatio = data.length === 1 ? 0 : i / (data.length - 1);
		const listenerRatio =
			listenerRange === 0
				? rankRatio
				: 1 - (x[1] - minListeners) / listenerRange;
		const tier = Math.round(
			rankRatio * maxTier * 0.75 + listenerRatio * maxTier * 0.25,
		);

		return [x[0], Math.max(0, Math.min(maxTier, tier)), x[2]];
	});

	for (const element of data) {
		if (Number.isNaN(element[1])) continue;

		const result = results[element[1]];
		const text = document.createElement("a");
		text.appendChild(document.createTextNode(element[0]));
		text.setAttribute("href", element[2]);
		result.appendChild(text);
	}

	for (const element of results) element.innerHTML = element.innerHTML.trim();
	setSuccess();
};

window.addEventListener("load", () => {
	document.getElementById("form").addEventListener("submit", handleSubmit);

	const button = document.getElementById("download");
	button.addEventListener("click", downloadJPG);

	document.getElementById("back").addEventListener("click", handleBack);
});
