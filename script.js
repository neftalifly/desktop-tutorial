const setupScreen = document.getElementById("setup-screen");
const prompterScreen = document.getElementById("prompter-screen");
const resultScreen = document.getElementById("result-screen");

const scriptInput = document.getElementById("script-input");
const speedRange = document.getElementById("speed-range");
const speedValue = document.getElementById("speed-value");
const fontRange = document.getElementById("font-range");
const fontValue = document.getElementById("font-value");
const mirrorToggle = document.getElementById("mirror-toggle");

const startBtn = document.getElementById("start-btn");
const backBtn = document.getElementById("back-btn");
const scrollToggleBtn = document.getElementById("scroll-toggle-btn");
const recordBtn = document.getElementById("record-btn");
const flipCameraBtn = document.getElementById("flip-camera-btn");
const newRecordingBtn = document.getElementById("new-recording-btn");

const cameraPreview = document.getElementById("camera-preview");
const prompterText = document.getElementById("prompter-text");
const prompterOverlay = document.getElementById("prompter-overlay");
const recordingBadge = document.getElementById("recording-badge");
const resultVideo = document.getElementById("result-video");
const downloadLink = document.getElementById("download-link");
const statusMessage = document.getElementById("status-message");

let mediaStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let scrollAnimationId = null;
let scrollPosition = 0;
let isScrolling = false;
let facingMode = "user";
let statusTimeout = null;

const savedScript = localStorage.getItem("teleprompter-script");
if (savedScript) {
  scriptInput.value = savedScript;
}

function showScreen(screen) {
  [setupScreen, prompterScreen, resultScreen].forEach((el) => {
    const isTarget = el === screen;
    el.hidden = !isTarget;
    el.classList.toggle("screen--active", isTarget);
  });
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("status-message--error", isError);
  statusMessage.classList.add("status-message--visible");

  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => {
    statusMessage.classList.remove("status-message--visible");
  }, 4000);
}

function updateSpeedLabel() {
  speedValue.textContent = speedRange.value;
}

function updateFontLabel() {
  fontValue.textContent = `${fontRange.value}px`;
  prompterText.style.fontSize = `${fontRange.value}px`;
}

function applyMirror() {
  prompterText.classList.toggle("prompter-text--mirrored", mirrorToggle.checked);
}

function getScrollSpeed() {
  return Number(speedRange.value) * 0.35;
}

function preparePrompterText() {
  const text = scriptInput.value.trim() || "Escribe tu guion en la pantalla anterior.";
  prompterText.textContent = text;
  scrollPosition = 0;
  prompterText.style.transform = mirrorToggle.checked
    ? `scaleX(-1) translateY(${scrollPosition}px)`
    : `translateY(${scrollPosition}px)`;
}

function stopScrolling() {
  isScrolling = false;
  scrollToggleBtn.textContent = "▶ Iniciar lectura";
  if (scrollAnimationId) {
    cancelAnimationFrame(scrollAnimationId);
    scrollAnimationId = null;
  }
}

function scrollStep() {
  if (!isScrolling) return;

  scrollPosition -= getScrollSpeed();
  prompterText.style.transform = mirrorToggle.checked
    ? `scaleX(-1) translateY(${scrollPosition}px)`
    : `translateY(${scrollPosition}px)`;

  scrollAnimationId = requestAnimationFrame(scrollStep);
}

function startScrolling() {
  if (isScrolling) return;
  isScrolling = true;
  scrollToggleBtn.textContent = "⏸ Pausar lectura";
  scrollAnimationId = requestAnimationFrame(scrollStep);
}

function toggleScrolling() {
  if (isScrolling) {
    stopScrolling();
  } else {
    startScrolling();
  }
}

async function getCameraStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: true,
  });

  cameraPreview.srcObject = mediaStream;
  cameraPreview.classList.toggle("camera-preview--back", facingMode === "environment");
}

async function startCamera() {
  const text = scriptInput.value.trim();
  if (!text) {
    showStatus("Escribe un guion antes de continuar.", true);
    scriptInput.focus();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    showStatus("Tu navegador no soporta acceso a la cámara.", true);
    return;
  }

  startBtn.disabled = true;
  startBtn.textContent = "Activando cámara...";

  try {
    localStorage.setItem("teleprompter-script", text);
    preparePrompterText();
    applyMirror();
    updateFontLabel();
    await getCameraStream();
    showScreen(prompterScreen);
    showStatus("Cámara activa. Pulsa Grabar cuando estés listo.");
  } catch (error) {
    const message =
      error.name === "NotAllowedError"
        ? "Permiso denegado. Activa cámara y micrófono en tu navegador."
        : "No se pudo acceder a la cámara. Usa HTTPS y el navegador del teléfono.";
    showStatus(message, true);
  } finally {
    startBtn.disabled = false;
    startBtn.textContent = "Activar cámara";
  }
}

function stopCamera() {
  stopScrolling();
  stopRecording();

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  cameraPreview.srcObject = null;
}

function getSupportedMimeType() {
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];

  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function startRecording() {
  if (!mediaStream || mediaRecorder?.state === "recording") return;

  if (typeof MediaRecorder === "undefined") {
    showStatus("Tu navegador no soporta grabación de video.", true);
    return;
  }

  recordedChunks = [];
  const mimeType = getSupportedMimeType();

  try {
    mediaRecorder = mimeType
      ? new MediaRecorder(mediaStream, { mimeType })
      : new MediaRecorder(mediaStream);
  } catch {
    showStatus("No se pudo iniciar la grabación en este dispositivo.", true);
    return;
  }

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = handleRecordingStop;
  mediaRecorder.start(1000);

  recordBtn.textContent = "■ Detener";
  recordBtn.classList.add("is-recording");
  recordingBadge.hidden = false;
  startScrolling();
  showStatus("Grabando...");
}

function stopRecording() {
  if (mediaRecorder?.state === "recording") {
    mediaRecorder.stop();
  }

  recordBtn.textContent = "● Grabar";
  recordBtn.classList.remove("is-recording");
  recordingBadge.hidden = true;
}

function handleRecordingStop() {
  stopScrolling();

  if (recordedChunks.length === 0) {
    showStatus("No se guardó ningún video.", true);
    return;
  }

  const mimeType = recordedChunks[0].type || "video/webm";
  const blob = new Blob(recordedChunks, { type: mimeType });
  const url = URL.createObjectURL(blob);

  resultVideo.src = url;
  downloadLink.href = url;
  downloadLink.download = `teleprompter-${Date.now()}.${mimeType.includes("mp4") ? "mp4" : "webm"}`;

  stopCamera();
  showScreen(resultScreen);
  showStatus("Video listo para ver o descargar.");
}

function toggleRecording() {
  if (mediaRecorder?.state === "recording") {
    stopRecording();
  } else {
    startRecording();
  }
}

async function flipCamera() {
  facingMode = facingMode === "user" ? "environment" : "user";

  try {
    await getCameraStream();
    showStatus(facingMode === "user" ? "Cámara frontal" : "Cámara trasera");
  } catch {
    facingMode = facingMode === "user" ? "environment" : "user";
    showStatus("No se pudo cambiar de cámara.", true);
  }
}

function goBack() {
  stopCamera();
  showScreen(setupScreen);
}

function resetForNewRecording() {
  if (resultVideo.src) {
    URL.revokeObjectURL(resultVideo.src);
    resultVideo.removeAttribute("src");
  }

  recordedChunks = [];
  mediaRecorder = null;
  showScreen(setupScreen);
}

speedRange.addEventListener("input", updateSpeedLabel);
fontRange.addEventListener("input", updateFontLabel);
mirrorToggle.addEventListener("change", applyMirror);
startBtn.addEventListener("click", startCamera);
backBtn.addEventListener("click", goBack);
scrollToggleBtn.addEventListener("click", toggleScrolling);
recordBtn.addEventListener("click", toggleRecording);
flipCameraBtn.addEventListener("click", flipCamera);
newRecordingBtn.addEventListener("click", resetForNewRecording);

scriptInput.addEventListener(
  "input",
  () => {
    localStorage.setItem("teleprompter-script", scriptInput.value);
  },
  { passive: true }
);

updateSpeedLabel();
updateFontLabel();
