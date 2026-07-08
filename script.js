/* ===== NAV ===== */
const header = document.getElementById("header");
const navToggle = document.getElementById("nav-toggle");
const nav = document.getElementById("nav");

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("nav--open");
  navToggle.classList.toggle("nav-toggle--active", isOpen);
  navToggle.setAttribute("aria-expanded", isOpen);
});

nav.querySelectorAll(".nav__link").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("nav--open");
    navToggle.classList.remove("nav-toggle--active");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

window.addEventListener("scroll", () => {
  header.classList.toggle("header--scrolled", window.scrollY > 40);
}, { passive: true });

/* ===== SCROLL REVEAL ===== */
const revealEls = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal--visible");
      }
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);

revealEls.forEach((el) => revealObserver.observe(el));

/* ===== COUNTER ANIMATION ===== */
function animateCounter(el) {
  const target = Number(el.dataset.target);
  const duration = 1800;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll(".stat__number").forEach(animateCounter);
        statsObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

const statsEl = document.querySelector(".hero__stats");
if (statsEl) statsObserver.observe(statsEl);

/* ===== CONTACTO & REDES ===== */
const CONTACT = {
  whatsapp: "522225047271",
  social: {
    tiktok: "",
    instagram: "",
    facebook: "",
  },
};

document.querySelectorAll("[data-social]").forEach((link) => {
  const platform = link.dataset.social;
  const url = CONTACT.social[platform];

  if (url) {
    link.href = url;
  } else {
    link.href = "#";
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (formStatus) {
        formStatus.textContent = `Pronto agregamos el enlace de ${platform}.`;
        setTimeout(() => { formStatus.textContent = ""; }, 3000);
      }
    });
  }
});

/* ===== CONTACT FORM ===== */
const contactForm = document.getElementById("contact-form");
const formStatus = document.getElementById("form-status");

contactForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = new FormData(contactForm);
  const nombre = data.get("nombre");
  const email = data.get("email");
  const tipo = data.get("tipo");
  const mensaje = data.get("mensaje");

  const texto = `Hola, soy ${nombre}.\nEmail: ${email}\nProyecto: ${tipo}\n\n${mensaje}`;
  const url = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(texto)}`;

  window.open(url, "_blank", "noopener,noreferrer");
  formStatus.textContent = "✓ Abriendo WhatsApp...";
  contactForm.reset();

  setTimeout(() => {
    formStatus.textContent = "";
  }, 4000);
});

/* ===== PARTICLES ===== */
const particlesCanvas = document.getElementById("particles-canvas");
const pCtx = particlesCanvas.getContext("2d");
let particles = [];

function resizeParticles() {
  particlesCanvas.width = window.innerWidth;
  particlesCanvas.height = window.innerHeight;
}

function initParticles() {
  particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * particlesCanvas.width,
    y: Math.random() * particlesCanvas.height,
    size: Math.random() * 2 + 0.5,
    speedX: (Math.random() - 0.5) * 0.4,
    speedY: (Math.random() - 0.5) * 0.4,
    opacity: Math.random() * 0.5 + 0.1,
  }));
}

function drawParticles() {
  pCtx.clearRect(0, 0, particlesCanvas.width, particlesCanvas.height);

  particles.forEach((p) => {
    p.x += p.speedX;
    p.y += p.speedY;

    if (p.x < 0) p.x = particlesCanvas.width;
    if (p.x > particlesCanvas.width) p.x = 0;
    if (p.y < 0) p.y = particlesCanvas.height;
    if (p.y > particlesCanvas.height) p.y = 0;

    pCtx.beginPath();
    pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    pCtx.fillStyle = `rgba(43, 140, 255, ${p.opacity * 0.6})`;
    pCtx.fill();
  });

  requestAnimationFrame(drawParticles);
}

resizeParticles();
initParticles();
drawParticles();

window.addEventListener("resize", () => {
  resizeParticles();
  initParticles();
});

/* ===== THREE.JS HERO ===== */
function initHero3D() {
  const canvas = document.getElementById("hero-3d");
  if (!canvas || typeof THREE === "undefined") return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 4;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });

  function resizeRenderer() {
    const size = canvas.clientWidth;
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  }

  resizeRenderer();

  const geometry = new THREE.IcosahedronGeometry(1.2, 1);
  const material = new THREE.MeshBasicMaterial({
    color: 0x2b8cff,
    wireframe: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const innerGeo = new THREE.OctahedronGeometry(0.7, 0);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xff8c00,
    wireframe: true,
  });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  scene.add(innerMesh);

  const ringGeo = new THREE.TorusGeometry(1.8, 0.02, 8, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x1e5fd9 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  scene.add(ring);

  let mouseX = 0;
  let mouseY = 0;

  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  });

  canvas.addEventListener("touchmove", (e) => {
    if (!e.touches[0]) return;
    const rect = canvas.getBoundingClientRect();
    mouseX = ((e.touches[0].clientX - rect.left) / rect.width - 0.5) * 2;
    mouseY = ((e.touches[0].clientY - rect.top) / rect.height - 0.5) * 2;
  }, { passive: true });

  function animate() {
    requestAnimationFrame(animate);

    mesh.rotation.x += 0.004;
    mesh.rotation.y += 0.006;
    innerMesh.rotation.x -= 0.008;
    innerMesh.rotation.y -= 0.005;
    ring.rotation.z += 0.003;

    mesh.rotation.y += mouseX * 0.02;
    mesh.rotation.x += mouseY * 0.02;

    renderer.render(scene, camera);
  }

  animate();

  window.addEventListener("resize", resizeRenderer);
}

initHero3D();

/* ===== GALLERY TILT ===== */
document.querySelectorAll(".gallery__item").forEach((item) => {
  item.addEventListener("mousemove", (e) => {
    const rect = item.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    item.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
  });

  item.addEventListener("mouseleave", () => {
    item.style.transform = "";
  });
});
