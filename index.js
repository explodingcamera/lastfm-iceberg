import { getData } from "./api.js";
import { toJpeg } from "https://esm.sh/html-to-image@1.9.0";

if (document.location.host === "explodingcamera.github.io") {
  document.location = "https://lastfm-iceberg.dawdle.space";
}

const downloadJPG = () => {
  const el = document.getElementById('results');

  toJpeg(el, { quality: 0.95 })
    .then(function (dataUrl) {
        var link = document.createElement('a');
        link.download = 'iceberg.jpeg';
        link.href = dataUrl;
        link.click();
    });
}

const setError = (error) => {
  document.getElementById("submit").disabled = false;
  document.getElementById("message").style.display = "none";
  document.getElementById("download").style.display = "none";
  document.getElementById("error").innerHTML = "Error: " + error + ".";
  document.getElementById("error").style.display = "block";
};

const setSubmitted = () => {
  document.getElementById("submit").disabled = true;
  document.getElementById("message").style.display = "block";
  document.getElementById("download").style.display = "none";
  document.getElementById("error").style.display = "none";
  document.getElementById("results").style.display = "none";
};

const setSuccess = () => {
  document.getElementById("submit").disabled = false;
  document.getElementById("message").style.display = "none";
  document.getElementById("results").style.display = "block";
  document.getElementById("download").style.display = "block";
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitted();
  
  for (const result of document.getElementsByClassName("result")) result.innerHTML = "";

  const options = Object.fromEntries(
    new FormData(document.getElementById("form")).entries()
  );

  let data;
  try {
    data = await getData(options);
  } catch (error) {
    setError(error.message);
    return
  }

  data = data.sort((x, y) => x[1] - y[1]).reverse();
  data = data.map((x) => [x[0], x[1] - Math.min(...data.map((x) => x[1])), x[2]]);
  data = data.map((x) => [x[0], x[1] / Math.max(...data.map((x) => x[1])), x[2]]);
  data = data.map((x) => [x[0], 8 - x[1] * 8, x[2]]);
  data = data.map((x, i) => [x[0], Math.round((x[1] + (i / data.length) * 24) / 4), x[2]]);

  for (const element of data) {
    if (isNaN(element[1])) continue;
    
    const result = document.getElementsByClassName("result")[element[1]];
    const text = document.createElement("a");
    text.appendChild(document.createTextNode(element[0]));
    text.setAttribute("href", element[2]);
    result.appendChild(text);
  }


  for (const element of document.getElementsByClassName("result")) element.innerHTML = element.innerHTML.trim();
  setSuccess();
};

window.addEventListener("load", () => {
  document.getElementById("form").addEventListener("submit", handleSubmit);


  const button = document.getElementById("download");
  button.addEventListener("click", downloadJPG);
});