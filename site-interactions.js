const header = document.querySelector("header.site-header");
const menuToggle = document.querySelector(".menu-toggle");
const navigation = document.querySelector(".navigation");
const motionToggle = document.querySelector(".motion-toggle");
const themeToggle = document.querySelector(".theme-toggle");
const themeToggleLabel = document.querySelector(".theme-toggle-label");
const motionLabel = document.querySelector(".motion-label");
const motionAction = document.querySelector(".motion-action");
const listeningStory = document.querySelector(".listening-story");
const motionMedia = window.matchMedia("(prefers-reduced-motion: reduce)");
const gsapAvailable = Boolean(window.gsap && window.ScrollTrigger);
let storedMotion = null;
try {
  storedMotion = window.localStorage.getItem("audira-motion");
} catch (error) {
  console.warn("AUDIRA motion preference could not be read.", error);
}
let motionEnabled = storedMotion === "on" || (storedMotion !== "off" && !motionMedia.matches);
let motionInitialized = false;
let tiltListenersInitialized = false;
let magneticListenersInitialized = false;
let smoothScroll = null;
let lenisTicker = null;
let activeSlide = 0;
let storedTheme = null;
try {
  storedTheme = window.localStorage.getItem("audira-theme");
} catch (error) {
  console.warn("AUDIRA theme preference could not be read.", error);
}
let lightThemeEnabled = storedTheme === "light";

function updateThemeButton() {
  document.documentElement.dataset.theme = lightThemeEnabled ? "light" : "dark";
  themeToggle.setAttribute("aria-pressed", String(lightThemeEnabled));
  themeToggle.setAttribute("aria-label", lightThemeEnabled ? "Switch to dark theme" : "Switch to light theme");
  themeToggleLabel.textContent = lightThemeEnabled ? "Dark mode" : "Light mode";
}

themeToggle.addEventListener("click", () => {
  lightThemeEnabled = !lightThemeEnabled;
  storedTheme = lightThemeEnabled ? "light" : "dark";
  try {
    window.localStorage.setItem("audira-theme", storedTheme);
  } catch (error) {
    console.warn("AUDIRA theme preference could not be saved.", error);
  }
  updateThemeButton();
});
updateThemeButton();

function dismissLoader() {
  document.body.classList.add("is-ready");
}
if (document.readyState === "complete") {
  window.setTimeout(dismissLoader, 350);
} else {
  window.addEventListener("load", () => window.setTimeout(dismissLoader, 350), { once: true });
  window.setTimeout(dismissLoader, 1800);
}

gsapAvailable && gsap.registerPlugin(ScrollTrigger);

let lastScrollY = window.scrollY;
const updateHeader = () => {
  const currentY = window.scrollY;
  const isScrollingDown = currentY > lastScrollY + 2;
  header.classList.toggle("is-scrolled", currentY > 24);
  header.classList.toggle("is-hidden", currentY > 170 && isScrollingDown);
  if (currentY < 48 || !isScrollingDown) header.classList.remove("is-hidden");
  lastScrollY = currentY;
};
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

function updateMotionButton() {
  motionToggle.setAttribute("aria-pressed", String(motionEnabled));
  motionToggle.setAttribute("aria-label", motionEnabled ? "Motion on — pause animations" : "Motion off — enable animations");
  motionLabel.textContent = motionEnabled ? "Motion on" : "Motion off";
  motionAction.textContent = motionEnabled ? "Pause" : "Enable";
  document.documentElement.dataset.motion = motionEnabled ? "on" : "off";
  document.dispatchEvent(new CustomEvent("audira:motion", { detail: { enabled: motionEnabled } }));
}

function closeMenu() {
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  navigation.classList.remove("is-open");
  document.body.classList.remove("menu-open");
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
  navigation.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
});

navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 680) closeMenu();
});

const revealItems = document.querySelectorAll(".reveal");
if (!gsapAvailable && !motionMedia.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.13, rootMargin: "0px 0px -35px 0px" });
  revealItems.forEach((item) => revealObserver.observe(item));
} else if (motionMedia.matches) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

function stopMotion() {
  if (!motionInitialized) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  gsap.globalTimeline.clear();
  gsap.killTweensOf("*");
  gsap.set([
    ".hero-eyebrow", ".hero h1", ".hero-title-line > span", ".hero-description",
    ".hero-actions", ".hero-portrait", ".hero-product-card", ".hero-rating",
    ".hero-stamp", ".hero-progress span", ".hero-halo", ".quote-orbit",
    ".product-image", ".product-image img", ".story-art", ".button", ".header-cta",
    ".listening-story-frame", ".story-copy", ".story-art img", ".story-progress span",
    ".reveal",
  ], { clearProps: "all" });
  listeningStory?.classList.remove("is-immersive");
  if (smoothScroll) {
    gsap.ticker.remove(lenisTicker);
    smoothScroll.destroy();
    smoothScroll = null;
    lenisTicker = null;
    document.documentElement.classList.remove("lenis");
  }
  revealItems.forEach((item) => item.classList.add("is-visible"));
  motionInitialized = false;
}

function setupMotion() {
  if (!gsapAvailable || !motionEnabled || motionInitialized) return;
  motionInitialized = true;
  const entrance = gsap.timeline({ defaults: { ease: "power3.out" }, delay: 0.15 });
  entrance
    .from(".hero-eyebrow", { autoAlpha: 0, y: 14, duration: 0.7 })
    .from(".hero-title-line > span", { yPercent: 110, duration: 1, stagger: 0.12 }, "-=0.4")
    .from(".hero-description, .hero-actions", { autoAlpha: 0, y: 14, duration: 0.7, stagger: 0.12 }, "-=0.55")
    .from(".hero-portrait", { scale: 1.14, duration: 1.65, ease: "power2.out" }, 0)
    .from(".hero-product-card", { autoAlpha: 0, y: 30, rotateY: -9, duration: 1.1 }, "-=0.85")
    .from(".hero-rating, .hero-stamp", { autoAlpha: 0, duration: 0.55, stagger: 0.1 }, "-=0.6");

  gsap.utils.toArray(".reveal").forEach((item) => {
    gsap.fromTo(item, { autoAlpha: 0, y: 20 }, {
      autoAlpha: 1,
      y: 0,
      duration: 0.85,
      ease: "power3.out",
      scrollTrigger: { trigger: item, start: "top 88%", once: true },
    });
  });

  if (listeningStory) {
    const stage = listeningStory.querySelector(".listening-story-stage");
    const frames = gsap.utils.toArray(".listening-story-frame", listeningStory);
    const images = frames.map((frame) => frame.querySelector(".story-art img"));
    const copy = frames.map((frame) => frame.querySelector(".story-copy"));
    const progress = gsap.utils.toArray(".story-progress span", listeningStory);
    listeningStory.classList.add("is-immersive");
    gsap.set(frames, { autoAlpha: 0 });
    gsap.set(frames[0], { autoAlpha: 1 });
    gsap.set(copy, { autoAlpha: 0, y: 22 });
    gsap.set(copy[0], { autoAlpha: 1, y: 0 });
    gsap.set(images, { scale: 1.14, rotationY: -7, clipPath: "inset(5% 7% 5% 7%)" });
    gsap.set(images[0], { scale: 1.06, rotationY: 0, clipPath: "inset(0% 0% 0% 0%)" });
    gsap.set(progress, { scaleX: 0 });
    gsap.set(progress[0], { scaleX: 1 });

    const storyTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: listeningStory,
        start: "top top",
        end: () => `+=${window.innerHeight * (frames.length - 1)}`,
        pin: stage,
        scrub: 0.65,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });
    storyTimeline.to(images[0], { scale: 1.18, rotationY: 4, ease: "none", duration: 1.15 }, 0);
    storyTimeline.to(progress[0], { scaleX: 1, ease: "none", duration: 0.9 }, 0);

    frames.slice(1).forEach((frame, offset) => {
      const index = offset + 1;
      const transitionAt = offset + 0.78;
      storyTimeline.to(frames[index - 1], { autoAlpha: 0, duration: 0.32, ease: "power1.inOut" }, transitionAt);
      storyTimeline.fromTo(frame, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.32, ease: "power1.inOut" }, transitionAt);
      storyTimeline.fromTo(copy[index], { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" }, transitionAt + 0.05);
      storyTimeline.fromTo(images[index], {
        scale: 1.16,
        rotationY: -8,
        clipPath: "inset(5% 7% 5% 7%)",
      }, {
        scale: 1,
        rotationY: 0,
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 1.05,
        ease: "power2.out",
      }, transitionAt);
      storyTimeline.to(progress[index], { scaleX: 1, ease: "none", duration: 0.82 }, transitionAt);
    });
    ScrollTrigger.refresh();
  }

  gsap.to(".hero-progress span", {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.2 },
  });
  gsap.to(".hero-portrait", {
    yPercent: 12,
    scale: 1.14,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 },
  });
  gsap.to(".hero-product-card", {
    yPercent: 18,
    rotateY: 4,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 },
  });
  gsap.to(".quote-orbit", {
    rotation: 24,
    ease: "none",
    scrollTrigger: { trigger: ".quote-band", start: "top bottom", end: "bottom top", scrub: 0.8 },
  });
  gsap.to(".hero-halo", {
    scale: 1.18,
    opacity: 0.72,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.8 },
  });
  gsap.utils.toArray(".product-image img, .why-image img").forEach((image) => {
    gsap.fromTo(image, { clipPath: "inset(12% 8% 12% 8%)" }, {
      clipPath: "inset(0% 0% 0% 0%)",
      scale: 1,
      ease: "none",
      scrollTrigger: { trigger: image, start: "top 88%", end: "top 28%", scrub: 0.65 },
    });
  });
  gsap.utils.toArray(".product-image img").forEach((image) => {
    gsap.fromTo(image, { scale: 1.12 }, {
      scale: 1,
      ease: "none",
      scrollTrigger: { trigger: image, start: "top bottom", end: "bottom top", scrub: 0.7 },
    });
  });

  smoothScroll = window.Lenis
    ? new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.2 })
    : null;
  if (smoothScroll) {
    document.documentElement.classList.add("lenis");
    smoothScroll.on("scroll", ScrollTrigger.update);
    lenisTicker = (time) => smoothScroll?.raf(time * 1000);
    gsap.ticker.add(lenisTicker);
    gsap.ticker.lagSmoothing(0);
  }

  const heroVideo = document.querySelector(".hero-portrait");
  if (heroVideo instanceof HTMLVideoElement) {
    const syncHeroVideo = () => {
      if (motionEnabled && !document.hidden) {
        heroVideo.play().catch((error) => {
          if (error.name !== "NotAllowedError" && error.name !== "AbortError") {
            console.warn("AUDIRA hero video could not start playback.", error);
          }
        });
      } else {
        heroVideo.pause();
      }
    };
    document.addEventListener("audira:motion", syncHeroVideo);
    document.addEventListener("visibilitychange", syncHeroVideo);
    syncHeroVideo();
  }

  if (!tiltListenersInitialized) {
    document.querySelectorAll("[data-tilt], .product-image, .story-art").forEach((card) => {
      const tiltX = gsap.quickTo(card, "rotationX", { duration: 0.42, ease: "power2.out" });
      const tiltY = gsap.quickTo(card, "rotationY", { duration: 0.42, ease: "power2.out" });
      const scaleX = gsap.quickTo(card, "scaleX", { duration: 0.42, ease: "power2.out" });
      const scaleY = gsap.quickTo(card, "scaleY", { duration: 0.42, ease: "power2.out" });
      card.addEventListener("pointermove", (event) => {
        if (!motionEnabled || event.pointerType === "touch") return;
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        card.style.setProperty("--pointer-x", `${(x + 0.5) * 100}%`);
        card.style.setProperty("--pointer-y", `${(y + 0.5) * 100}%`);
        tiltX(-y * 7);
        tiltY(x * 8);
        scaleX(1.015);
        scaleY(1.015);
      });
      card.addEventListener("pointerleave", () => {
        if (!motionEnabled) return;
        card.style.setProperty("--pointer-x", "50%");
        card.style.setProperty("--pointer-y", "50%");
        gsap.to(card, { rotationX: 0, rotationY: 0, scale: 1, duration: 0.7, ease: "elastic.out(1, 0.55)", overwrite: "auto" });
      });
    });
    tiltListenersInitialized = true;
  }

  if (!magneticListenersInitialized) {
    document.querySelectorAll(".button, .header-cta").forEach((link) => {
      const moveX = gsap.quickTo(link, "x", { duration: 0.35, ease: "power3.out" });
      const moveY = gsap.quickTo(link, "y", { duration: 0.35, ease: "power3.out" });
      link.addEventListener("pointermove", (event) => {
        if (!motionEnabled || event.pointerType === "touch") return;
        const bounds = link.getBoundingClientRect();
        moveX(((event.clientX - bounds.left) / bounds.width - 0.5) * 9);
        moveY(((event.clientY - bounds.top) / bounds.height - 0.5) * 7);
      });
      link.addEventListener("pointerleave", () => {
        moveX(0);
        moveY(0);
      });
    });
    magneticListenersInitialized = true;
  }
}

motionToggle.addEventListener("click", () => {
  motionEnabled = !motionEnabled;
  storedMotion = motionEnabled ? "on" : "off";
  try {
    window.localStorage.setItem("audira-motion", storedMotion);
  } catch (error) {
    console.warn("AUDIRA motion preference could not be saved.", error);
  }
  updateMotionButton();
  if (motionEnabled) setupMotion();
  else stopMotion();
});
updateMotionButton();
if (motionEnabled) setupMotion();

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const activeLink = navigation.querySelector(`a[href="#${entry.target.id}"]`);
    navigation.querySelectorAll("a").forEach((link) => link.removeAttribute("aria-current"));
    activeLink?.setAttribute("aria-current", "location");
  });
}, { rootMargin: "-34% 0px -56% 0px", threshold: 0 });
document.querySelectorAll("main section[id]").forEach((section) => sectionObserver.observe(section));

motionMedia.addEventListener("change", (event) => {
  if (storedMotion !== null) return;
  motionEnabled = !event.matches;
  updateMotionButton();
  if (motionEnabled) setupMotion();
  else stopMotion();
});

const testimonials = Array.from(document.querySelectorAll(".testimonial"));
const slideCount = document.querySelector(".slide-count");
function showTestimonial(index) {
  const current = testimonials[activeSlide];
  if (motionEnabled && gsapAvailable && current) {
    gsap.to(current, { autoAlpha: 0, y: -12, duration: 0.18, onComplete: () => activateTestimonial(index) });
  } else {
    activateTestimonial(index);
  }
}
function activateTestimonial(index) {
  activeSlide = (index + testimonials.length) % testimonials.length;
  testimonials.forEach((testimonial, position) => {
    testimonial.classList.toggle("is-active", position === activeSlide);
  });
  slideCount.innerHTML = `${String(activeSlide + 1).padStart(2, "0")} <i>/</i> ${String(testimonials.length).padStart(2, "0")}`;
  if (motionEnabled && gsapAvailable) gsap.fromTo(testimonials[activeSlide], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out" });
}
document.querySelector(".slider-button.previous").addEventListener("click", () => showTestimonial(activeSlide - 1));
document.querySelector(".slider-button.next").addEventListener("click", () => showTestimonial(activeSlide + 1));

const newsletterForm = document.querySelector(".newsletter-form");
const emailInput = newsletterForm.querySelector('input[type="email"]');
const formMessage = document.querySelector(".form-message");
newsletterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  formMessage.classList.remove("is-error");
  if (!emailInput.validity.valid) {
    formMessage.textContent = emailInput.value.trim()
      ? "Please enter a valid email address."
      : "Please enter your email address to join.";
    formMessage.classList.add("is-error");
    emailInput.focus();
    return;
  }
  formMessage.textContent = "You’re on the list. We’ll be in touch when there’s something worth hearing.";
  newsletterForm.reset();
});
