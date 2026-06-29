const hero = document.querySelector(".hero");
const canvas = document.querySelector(".image-reveal");
const ctx = canvas.getContext("2d");
const image = new Image();
const maskCanvas = document.createElement("canvas");
const maskCtx = maskCanvas.getContext("2d");
const imageCanvas = document.createElement("canvas");
const imageCtx = imageCanvas.getContext("2d");

let heroBounds = hero.getBoundingClientRect();
let frameId = null;
let targetPoint = { x: heroBounds.width / 2, y: heroBounds.height / 2 };
let currentPoint = { ...targetPoint };
let phase = 0;

const edgeJitter = Array.from({ length: 28 }, (_, index) => {
  const a = index * 12.9898;
  return Math.sin(a) * 0.18 + Math.sin(a * 1.7) * 0.08;
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const refreshBounds = () => {
  heroBounds = hero.getBoundingClientRect();
  const width = Math.max(1, Math.round(heroBounds.width));
  const height = Math.max(1, Math.round(heroBounds.height));

  canvas.width = width;
  canvas.height = height;
  maskCanvas.width = width;
  maskCanvas.height = height;
  imageCanvas.width = width;
  imageCanvas.height = height;
};

const drawCoveredImage = () => {
  const { width, height } = canvas;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const canvasRatio = width / height;
  const coverWidth = imageRatio > canvasRatio ? height * imageRatio : width;
  const coverHeight = imageRatio > canvasRatio ? height : width / imageRatio;
  const overscan = 1.14;
  const drawWidth = coverWidth * overscan;
  const drawHeight = coverHeight * overscan;
  const parallaxX = (targetPoint.x / width - 0.5) * 42;
  const parallaxY = (targetPoint.y / height - 0.5) * 32;

  imageCtx.clearRect(0, 0, width, height);
  imageCtx.globalCompositeOperation = "source-over";
  imageCtx.filter = "none";
  imageCtx.drawImage(
    image,
    (width - drawWidth) / 2 - parallaxX,
    (height - drawHeight) / 2 - parallaxY,
    drawWidth,
    drawHeight,
  );
  imageCtx.fillStyle = "rgba(184, 196, 178, 0.22)";
  imageCtx.fillRect(0, 0, width, height);
};

const drawFreeformMask = () => {
  const { width, height } = canvas;
  const baseX = currentPoint.x;
  const baseY = currentPoint.y;
  const radiusX = clamp(width * 0.22, 230, 390);
  const radiusY = clamp(height * 0.17, 170, 300);
  const points = edgeJitter.length;

  maskCtx.clearRect(0, 0, width, height);
  maskCtx.filter = "blur(34px)";
  maskCtx.fillStyle = "rgba(0, 0, 0, 0.86)";
  maskCtx.beginPath();

  for (let index = 0; index <= points; index += 1) {
    const wrappedIndex = index % points;
    const angle = (wrappedIndex / points) * Math.PI * 2;
    const drift =
      1 +
      edgeJitter[wrappedIndex] +
      Math.sin(angle * 2.6 + phase) * 0.11 +
      Math.cos(angle * 5.1 - phase * 0.7) * 0.07;
    const x = baseX + Math.cos(angle) * radiusX * drift;
    const y = baseY + Math.sin(angle) * radiusY * drift;

    if (index === 0) {
      maskCtx.moveTo(x, y);
    } else {
      const prevAngle = ((wrappedIndex - 0.5) / points) * Math.PI * 2;
      const controlX = baseX + Math.cos(prevAngle) * radiusX * drift;
      const controlY = baseY + Math.sin(prevAngle) * radiusY * drift;
      maskCtx.quadraticCurveTo(controlX, controlY, x, y);
    }
  }

  maskCtx.closePath();
  maskCtx.fill();
  maskCtx.filter = "none";
};

const drawReveal = () => {
  frameId = null;

  currentPoint.x += (targetPoint.x - currentPoint.x) * 0.24;
  currentPoint.y += (targetPoint.y - currentPoint.y) * 0.24;
  phase += 0.035;

  drawCoveredImage();
  drawFreeformMask();

  imageCtx.globalCompositeOperation = "destination-in";
  imageCtx.drawImage(maskCanvas, 0, 0);
  imageCtx.globalCompositeOperation = "source-over";

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(imageCanvas, 0, 0);
};

const requestRevealFrame = () => {
  if (frameId || !image.complete) return;
  frameId = requestAnimationFrame(drawReveal);
};

const updateReveal = (event) => {
  targetPoint = {
    x: clamp(event.clientX - heroBounds.left, 0, heroBounds.width),
    y: clamp(event.clientY - heroBounds.top, 0, heroBounds.height),
  };

  hero.classList.add("is-revealing");
  requestRevealFrame();
};

const hideReveal = () => {
  hero.classList.remove("is-revealing");
};

const resetReveal = () => {
  refreshBounds();
  currentPoint = { ...targetPoint };
  requestRevealFrame();
};

image.src = "./assets/resonance-bg.jpg";
image.addEventListener("load", resetReveal, { once: true });

refreshBounds();

if (window.PointerEvent) {
  hero.addEventListener("pointerenter", resetReveal, { passive: true });
  hero.addEventListener("pointermove", updateReveal, { passive: true });
  hero.addEventListener("pointerleave", hideReveal, { passive: true });
} else {
  hero.addEventListener("mouseenter", resetReveal, { passive: true });
  hero.addEventListener("mousemove", updateReveal, { passive: true });
  hero.addEventListener("mouseleave", hideReveal, { passive: true });
}

window.addEventListener("resize", resetReveal, { passive: true });
