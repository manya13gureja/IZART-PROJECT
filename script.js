const hero = document.querySelector(".hero");

const updateReveal = (event) => {
  const rect = hero.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;

  hero.style.setProperty("--reveal-x", `${x}%`);
  hero.style.setProperty("--reveal-y", `${y}%`);
  hero.classList.add("is-revealing");
};

hero.addEventListener("pointermove", updateReveal);
hero.addEventListener("mousemove", updateReveal);
hero.addEventListener("pointerleave", () => {
  hero.classList.remove("is-revealing");
});
hero.addEventListener("mouseleave", () => {
  hero.classList.remove("is-revealing");
});
