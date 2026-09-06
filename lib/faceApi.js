// Client-only helper around face-api.js. Loaded from a CDN (script tag +
// model weights) instead of an npm dependency so the Next.js server bundle
// stays light — important on the free/shared hosting this project targets.
// face-api.js itself runs entirely in the browser (tensorflow.js under the
// hood), so there is no extra server cost either way.

const SCRIPT_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

let loadPromise = null;

export function loadFaceApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("face-api can only load in the browser"));
  }
  if (window.faceapi && window.__faceApiModelsReady) {
    return Promise.resolve(window.faceapi);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    function afterScript() {
      const faceapi = window.faceapi;
      if (!faceapi) return reject(new Error("face-api.js failed to load"));
      Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ])
        .then(() => {
          window.__faceApiModelsReady = true;
          resolve(faceapi);
        })
        .catch((err) => reject(err));
    }

    if (window.faceapi) {
      afterScript();
      return;
    }
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener("load", afterScript);
      existing.addEventListener("error", () => reject(new Error("face-api.js failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = afterScript;
    script.onerror = () => reject(new Error("face-api.js failed to load"));
    document.body.appendChild(script);
  });

  return loadPromise;
}

// Runs detection on a live <video> or <canvas>/<img> element and returns a
// plain 128-number array descriptor, or null if no face was found.
export async function getFaceDescriptor(mediaEl) {
  const faceapi = await loadFaceApi();
  const result = await faceapi
    .detectSingleFace(mediaEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!result) return null;
  return Array.from(result.descriptor);
}
