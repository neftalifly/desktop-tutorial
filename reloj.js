const horaEl = document.getElementById("hora");

function actualizarHora() {
  const ahora = new Date();
  horaEl.textContent = ahora.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

actualizarHora();
setInterval(actualizarHora, 1000);
