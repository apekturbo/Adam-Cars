/* =========================================================================
   ADAM MOTORSPORT — SCRIPT.JS
   -------------------------------------------------------------------------
   Table of contents:
   1. Static data (cars, featured cars, testimonials — non-translatable fields)
   2. i18n engine (load JSON, apply translations, persist choice)
   3. Rendering (car grid, featured track, testimonials)
   4. Navigation (scroll state, active link, mobile menu, smooth scroll)
   5. Scroll effects (rev bar, reveal-on-scroll, scroll-to-top, counters)
   6. Interactions (filters, accordion, testimonial carousel, contact form)
   7. Misc (preloader, ripple buttons, init)
   ========================================================================= */

/* -------------------------------------------------------------------------
   1. STATIC DATA
   Fields here never change with language. Translatable fields (name, model,
   badge, description) are merged in from the active language JSON at
   render time, matched by "id".
   ------------------------------------------------------------------------- */
const CAR_DATA = [
  {
    id: "civic", category: "sedan",
    img: "https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=1200&auto=format&fit=crop",
    price: 89900, transmission: "Automatic", fuel: "Petrol", engine: "1.5L Turbo", hp: "182 hp", mileage: "24,500 km"
  },
  {
    id: "camry", category: "sedan",
    img: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=1200&auto=format&fit=crop",
    price: 165000, transmission: "Automatic", fuel: "Petrol", engine: "2.5L", hp: "203 hp", mileage: "18,200 km"
  },
  {
    id: "cxfive", category: "suv",
    img: "https://images.unsplash.com/photo-1600661653561-629509216228?q=80&w=1200&auto=format&fit=crop",
    price: 148500, transmission: "Automatic", fuel: "Petrol", engine: "2.5L Turbo", hp: "227 hp", mileage: "12,800 km"
  },
  {
    id: "mustang", category: "sports",
    img: "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?q=80&w=1200&auto=format&fit=crop",
    price: 299900, transmission: "Manual", fuel: "Petrol", engine: "5.0L V8", hp: "460 hp", mileage: "31,400 km"
  },
  {
    id: "model3", category: "electric",
    img: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=1200&auto=format&fit=crop",
    price: 189000, transmission: "Automatic", fuel: "Electric", engine: "Dual Motor", hp: "346 hp", mileage: "9,600 km"
  },
  {
    id: "cclass", category: "sedan",
    img: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1200&auto=format&fit=crop",
    price: 235000, transmission: "Automatic", fuel: "Petrol", engine: "2.0L Turbo", hp: "255 hp", mileage: "14,900 km"
  }
];

const FEATURED_DATA = [
  { id: "911", img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200&auto=format&fit=crop", price: 780000, rating: 5 },
  { id: "rangerover", img: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?q=80&w=1200&auto=format&fit=crop", price: 520000, rating: 5 },
  { id: "m4", img: "https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200&auto=format&fit=crop", price: 468000, rating: 4 }
];

const TESTIMONIAL_AVATARS = [
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop"
];

/* -------------------------------------------------------------------------
   2. I18N ENGINE
   ------------------------------------------------------------------------- */
const SUPPORTED_LANGS = ["en", "ms", "zh", "ta"];
const FALLBACK_LANG = "en";
let currentLangData = null;
let fallbackLangData = null;

/** Reads a dotted path like "contact.formName" out of a nested object. */
function getPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
}

async function loadLangFile(lang) {
  const res = await fetch(`lang/${lang}.json`);
  if (!res.ok) throw new Error(`Could not load lang/${lang}.json`);
  return res.json();
}

/** Applies translations to every element with data-i18n / data-i18n-placeholder,
 *  falling back to English (or the original hard-coded HTML text) if a key is missing. */
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    const value = getPath(currentLangData, key) ?? getPath(fallbackLangData, key);
    if (value !== undefined) el.innerHTML = value;
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    const value = getPath(currentLangData, key) ?? getPath(fallbackLangData, key);
    if (value !== undefined) el.setAttribute("placeholder", value);
  });

  document.documentElement.lang = document.getElementById("langCurrent").dataset.lang || "en";

  // Re-render dynamic, data-driven sections in the new language
  renderCars(document.querySelector(".filter-btn.active")?.dataset.filter || "all");
  renderFeatured();
  renderTestimonials();
}

async function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = FALLBACK_LANG;
  try {
    if (!fallbackLangData) fallbackLangData = await loadLangFile(FALLBACK_LANG);
    currentLangData = lang === FALLBACK_LANG ? fallbackLangData : await loadLangFile(lang);
  } catch (err) {
    console.error("i18n load error, falling back to English:", err);
    currentLangData = fallbackLangData;
    lang = FALLBACK_LANG;
  }

  localStorage.setItem("am_lang", lang);
  const label = { en: "EN", ms: "MS", zh: "中文", ta: "TA" }[lang];
  const langCurrentEl = document.getElementById("langCurrent");
  langCurrentEl.textContent = label;
  langCurrentEl.dataset.lang = lang;

  document.querySelectorAll("#langList li").forEach(li => {
    li.classList.toggle("active", li.dataset.lang === lang);
  });

  applyTranslations();
}

function initLanguageSelector() {
  const wrap = document.getElementById("langSelect");
  const btn = document.getElementById("langBtn");
  const list = document.getElementById("langList");

  btn.addEventListener("click", () => {
    const isOpen = wrap.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", isOpen);
  });

  document.addEventListener("click", e => {
    if (!wrap.contains(e.target)) {
      wrap.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    }
  });

  list.querySelectorAll("li").forEach(li => {
    li.addEventListener("click", () => {
      setLanguage(li.dataset.lang);
      wrap.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
    });
  });

  const saved = localStorage.getItem("am_lang");
  const browserLang = (navigator.language || "en").slice(0, 2);
  const initial = saved || (SUPPORTED_LANGS.includes(browserLang) ? browserLang : FALLBACK_LANG);
  setLanguage(initial);
}

/* -------------------------------------------------------------------------
   3. RENDERING
   ------------------------------------------------------------------------- */
function formatRM(amount) {
  return "RM " + amount.toLocaleString("en-MY");
}

function specLabels() {
  return {
    transmission: getPath(currentLangData, "products.specTransmission") ?? "Transmission",
    fuel: getPath(currentLangData, "products.specFuel") ?? "Fuel Type",
    engine: getPath(currentLangData, "products.specEngine") ?? "Engine",
    hp: getPath(currentLangData, "products.specHorsepower") ?? "Horsepower",
    mileage: getPath(currentLangData, "products.specMileage") ?? "Mileage",
    view: getPath(currentLangData, "products.viewDetails") ?? "View Details",
    buy: getPath(currentLangData, "products.buyNow") ?? "Buy Now"
  };
}

function renderCars(filter = "all") {
  const grid = document.getElementById("carGrid");
  if (!grid || !currentLangData) return;
  const carsLang = getPath(currentLangData, "cars") || getPath(fallbackLangData, "cars") || [];
  const labels = specLabels();

  grid.classList.add("is-filtering");
  grid.innerHTML = CAR_DATA
    .filter(car => filter === "all" || car.category === filter)
    .map(car => {
      const lang = carsLang.find(c => c.id === car.id) || {};
      return `
        <article class="car-card" data-category="${car.category}">
          <div class="car-card__media">
            <img src="${car.img}" alt="${lang.name || car.id}" loading="lazy">
            <span class="car-card__tag">${lang.badge || ""}</span>
          </div>
          <div class="car-card__body">
            <h3 class="car-card__name">${lang.name || car.id}</h3>
            <p class="car-card__model">${lang.model || ""}</p>
            <div class="car-card__specs">
              <span>${labels.transmission}<strong>${car.transmission}</strong></span>
              <span>${labels.fuel}<strong>${car.fuel}</strong></span>
              <span>${labels.engine}<strong>${car.engine}</strong></span>
              <span>${labels.hp}<strong>${car.hp}</strong></span>
              <span>${labels.mileage}<strong>${car.mileage}</strong></span>
            </div>
            <div class="car-card__footer">
              <span class="car-card__price">${formatRM(car.price)}</span>
              <div class="car-card__actions">
                <button class="btn btn--outline" type="button">${labels.view}</button>
                <button class="btn btn--primary" type="button">${labels.buy}</button>
              </div>
            </div>
          </div>
        </article>`;
    })
    .join("");
}

function renderFeatured() {
  const track = document.getElementById("featuredTrack");
  if (!track || !currentLangData) return;
  const featuredLang = getPath(currentLangData, "featuredCars") || getPath(fallbackLangData, "featuredCars") || [];

  track.innerHTML = FEATURED_DATA.map(car => {
    const lang = featuredLang.find(c => c.id === car.id) || {};
    const badge = ["Bestseller", "New", "Limited Edition"][FEATURED_DATA.indexOf(car) % 3];
    const stars = "★".repeat(car.rating) + "☆".repeat(5 - car.rating);
    return `
      <article class="featured-card">
        <div class="featured-card__media">
          <img src="${car.img}" alt="${lang.name || car.id}" loading="lazy">
          <span class="featured-card__badge">${badge}</span>
        </div>
        <div class="featured-card__body">
          <div class="featured-card__rating" aria-hidden="true">${stars}</div>
          <h3 class="featured-card__name">${lang.name || car.id}</h3>
          <p class="featured-card__desc">${lang.desc || ""}</p>
          <span class="featured-card__price">${formatRM(car.price)}</span>
        </div>
      </article>`;
  }).join("");
}

let testimonialIndex = 0;
function renderTestimonials() {
  const track = document.getElementById("testimonialTrack");
  const dots = document.getElementById("testimonialDots");
  if (!track || !dots || !currentLangData) return;
  const data = getPath(currentLangData, "testimonialsData") || getPath(fallbackLangData, "testimonialsData") || [];

  track.innerHTML = data.map((t, i) => `
    <div class="testimonial-card">
      <img class="testimonial-card__avatar" src="${TESTIMONIAL_AVATARS[i % TESTIMONIAL_AVATARS.length]}" alt="" loading="lazy">
      <div class="testimonial-card__rating" aria-hidden="true">★★★★★</div>
      <p class="testimonial-card__text">&ldquo;${t.text}&rdquo;</p>
      <p class="testimonial-card__name">${t.name}</p>
    </div>`).join("");

  dots.innerHTML = data.map((_, i) => `<button aria-label="Show testimonial ${i + 1}"></button>`).join("");
  dots.querySelectorAll("button").forEach((dot, i) => dot.addEventListener("click", () => goToTestimonial(i)));

  testimonialIndex = 0;
  goToTestimonial(0);
}

function goToTestimonial(i) {
  const track = document.getElementById("testimonialTrack");
  const dots = document.getElementById("testimonialDots");
  if (!track) return;
  const count = track.children.length;
  testimonialIndex = (i + count) % count;
  track.style.transform = `translateX(-${testimonialIndex * 100}%)`;
  dots.querySelectorAll("button").forEach((dot, idx) => dot.classList.toggle("active", idx === testimonialIndex));
}

/* -------------------------------------------------------------------------
   4. NAVIGATION
   ------------------------------------------------------------------------- */
function initNav() {
  const nav = document.getElementById("siteNav");
  const burger = document.getElementById("navBurger");
  const links = document.getElementById("navLinks");

  window.addEventListener("scroll", () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 40);
  }, { passive: true });

  burger.addEventListener("click", () => {
    const isOpen = links.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", isOpen);
  });

  links.querySelectorAll(".nav__link").forEach(link => {
    link.addEventListener("click", () => {
      links.classList.remove("is-open");
      burger.setAttribute("aria-expanded", "false");
    });
  });

  // Active-link highlighting based on scroll position
  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...document.querySelectorAll(".nav__link")];

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove("active"));
        const match = navLinks.find(l => l.getAttribute("href") === `#${entry.target.id}`);
        if (match) match.classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

  sections.forEach(s => observer.observe(s));

  document.getElementById("scrollCue")?.addEventListener("click", () => {
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
  });
}

/* -------------------------------------------------------------------------
   5. SCROLL EFFECTS
   ------------------------------------------------------------------------- */
function initRevBar() {
  const bar = document.getElementById("revBar");
  window.addEventListener("scroll", () => {
    const scrolled = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${height > 0 ? (scrolled / height) * 100 : 0}%`;
  }, { passive: true });
}

function initRevealOnScroll() {
  const targets = document.querySelectorAll(".reveal-on-scroll");
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(t => observer.observe(t));
}

function initScrollTop() {
  const btn = document.getElementById("scrollTop");
  window.addEventListener("scroll", () => {
    btn.classList.toggle("is-visible", window.scrollY > 600);
  }, { passive: true });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initCounters() {
  const counters = document.querySelectorAll(".stat-card__number");
  const animate = el => {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1600;
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target).toLocaleString("en-MY");
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target.toLocaleString("en-MY") + "+";
    }
    requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => observer.observe(c));
}

/* -------------------------------------------------------------------------
   6. INTERACTIONS
   ------------------------------------------------------------------------- */
function initFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderCars(btn.dataset.filter);
    });
  });
}

function initAccordion() {
  document.querySelectorAll(".accordion__trigger").forEach(trigger => {
    trigger.addEventListener("click", () => {
      const panel = trigger.nextElementSibling;
      const isOpen = trigger.getAttribute("aria-expanded") === "true";

      document.querySelectorAll(".accordion__trigger").forEach(t => {
        t.setAttribute("aria-expanded", "false");
        t.nextElementSibling.style.maxHeight = null;
      });

      if (!isOpen) {
        trigger.setAttribute("aria-expanded", "true");
        panel.style.maxHeight = panel.scrollHeight + "px";
      }
    });
  });
}

function initTestimonialAutoplay() {
  setInterval(() => {
    const track = document.getElementById("testimonialTrack");
    if (track && track.children.length) goToTestimonial(testimonialIndex + 1);
  }, 6000);
}

function initContactForm() {
  const form = document.getElementById("contactForm");
  const success = document.getElementById("formSuccess");
  if (!form) return;

  const validators = {
    name: v => v.trim().length > 1,
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    phone: v => /^[0-9+\-\s]{7,}$/.test(v),
    message: v => v.trim().length > 4
  };

  form.addEventListener("submit", e => {
    e.preventDefault();
    let valid = true;

    Object.keys(validators).forEach(name => {
      const field = form.elements[name];
      const row = field.closest(".form-row");
      const ok = validators[name](field.value);
      row.classList.toggle("has-error", !ok);
      if (!ok) valid = false;
    });

    if (valid) {
      success.classList.add("is-visible");
      form.reset();
      setTimeout(() => success.classList.remove("is-visible"), 5000);
    }
  });

  // Clear error state as the person types
  form.querySelectorAll("input, textarea").forEach(field => {
    field.addEventListener("input", () => field.closest(".form-row").classList.remove("has-error"));
  });
}

/* -------------------------------------------------------------------------
   7. MISC — preloader, ripple buttons, init
   ------------------------------------------------------------------------- */
function initPreloader() {
  window.addEventListener("load", () => {
    setTimeout(() => document.getElementById("preloader")?.classList.add("is-hidden"), 500);
  });
}

function initRipple() {
  // Event delegation so this also covers car cards rendered later by renderCars()
  document.addEventListener("click", e => {
    const btn = e.target.closest(".btn");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();

  initPreloader();
  initNav();
  initRevBar();
  initScrollTop();
  initCounters();
  initFilters();
  initAccordion();
  initTestimonialAutoplay();
  initContactForm();
  initLanguageSelector(); // also triggers first render of cars/featured/testimonials
  initRevealOnScroll();
  initRipple();
});
