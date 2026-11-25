(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Theme ---------- */
  const themeBtn = document.querySelector(".theme-toggle");
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    if (themeBtn) {
      themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
    if (metaTheme) metaTheme.setAttribute("content", theme === "dark" ? "#0a192f" : "#e6f1ff");
  };

  applyTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) { /* private mode */ }
    });
  }

  /* ---------- Hero name: letter-by-letter reveal ---------- */
  const heroName = document.querySelector(".hero-name");
  if (heroName && !reduceMotion) {
    let i = 0;
    heroName.querySelectorAll(".word").forEach((word) => {
      [...word.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          [...node.textContent].forEach((char) => {
            const span = document.createElement("span");
            span.className = "ch";
            span.style.setProperty("--i", i++);
            span.textContent = char;
            span.setAttribute("aria-hidden", "true");
            frag.appendChild(span);
          });
          word.replaceChild(frag, node);
        } else if (node.classList && node.classList.contains("dot")) {
          node.classList.add("ch");
          node.style.setProperty("--i", i++);
        }
      });
    });
    heroName.classList.add("is-split");
  }

  /* ---------- Hero role: typing effect (as on the original site) ---------- */
  const typed = document.querySelector(".hero-role .typed");
  if (typed && !reduceMotion) {
    const fullText = typed.textContent.trim();
    typed.textContent = "";
    let pos = 0;
    const type = () => {
      if (pos < fullText.length) {
        typed.textContent += fullText.charAt(pos++);
        setTimeout(type, 55);
      }
    };
    setTimeout(type, 1100);
  }

  /* ---------- Header state, progress bar, back-to-top, timeline ---------- */
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress");
  const toTop = document.querySelector(".back-to-top");
  const timeline = document.querySelector(".timeline");
  const timelineItems = timeline ? [...timeline.querySelectorAll(".timeline-item")] : [];
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = root.scrollHeight - vh;
    header.classList.toggle("is-scrolled", y > 8);
    toTop.classList.toggle("is-visible", y > 700);
    progress.style.setProperty("--progress", max > 0 ? Math.min(y / max, 1).toFixed(4) : "0");

    if (timeline) {
      const r = timeline.getBoundingClientRect();
      const trigger = vh * 0.62;
      const fill = Math.min(Math.max((trigger - r.top) / r.height, 0), 1);
      timeline.style.setProperty("--fill", fill.toFixed(4));
      timelineItems.forEach((item) => {
        const dot = item.querySelector(".timeline-dot");
        if (dot) item.classList.toggle("is-lit", dot.getBoundingClientRect().top < trigger);
      });
    }
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* ---------- Cursor spotlight ---------- */
  const spotlight = document.querySelector(".spotlight");
  if (spotlight && finePointer && !reduceMotion) {
    window.addEventListener("pointermove", (e) => {
      spotlight.style.setProperty("--cx", `${e.clientX}px`);
      spotlight.style.setProperty("--cy", `${e.clientY}px`);
    }, { passive: true });
  }

  /* ---------- Mobile navigation ---------- */
  const nav = document.getElementById("primary-nav");
  const navToggle = document.querySelector(".nav-toggle");

  const setNav = (open) => {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  };

  navToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    setNav(!nav.classList.contains("is-open"));
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setNav(false);
  });
  document.addEventListener("click", (e) => {
    if (nav.classList.contains("is-open") && !nav.contains(e.target)) setNav(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setNav(false);
      navToggle.focus();
    }
  });

  /* ---------- Active section in nav ---------- */
  const navLinks = [...nav.querySelectorAll('a[href^="#"]')];
  const linkFor = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));

  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((l) => l.classList.remove("is-active"));
        const link = linkFor.get(entry.target.id);
        if (link) link.classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    linkFor.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
    const hero = document.getElementById("top");
    if (hero) spy.observe(hero);
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Count-up numbers ---------- */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
    const countIo = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        obs.unobserve(entry.target);
        const el = entry.target;
        const target = Number(el.dataset.count);
        const duration = 1600;
        const start = performance.now();
        const step = (now) => {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = String(Math.round(target * eased));
          if (t < 1) requestAnimationFrame(step);
        };
        el.textContent = "0";
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => countIo.observe(el));
  }

  /* ---------- Card spotlight ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Project modals ---------- */
  let lastTrigger = null;

  document.querySelectorAll("[data-dialog]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dialog = document.getElementById(btn.dataset.dialog);
      if (!dialog || typeof dialog.showModal !== "function") return;
      lastTrigger = btn;
      dialog.showModal();
      document.body.classList.add("modal-open");
    });
  });

  document.querySelectorAll("dialog.case").forEach((dialog) => {
    dialog.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      if (lastTrigger) lastTrigger.focus();
    });
    // A click on the backdrop (outside the content) closes the modal
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    const closeBtn = dialog.querySelector(".case-close");
    if (closeBtn) closeBtn.addEventListener("click", () => dialog.close());
  });

  /* ---------- Gmail: compose window on desktop, mail app on mobile ----------
     The address is read from the button's own mailto: link, so it lives in one place. */
  const gmailButton = document.getElementById("gmail-button");
  if (gmailButton) {
    const address = gmailButton.getAttribute("href").replace(/^mailto:/i, "").split("?")[0];
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const subject = encodeURIComponent("Potential Collaboration – Inspired by Your Portfolio");
    const body = encodeURIComponent("Hi Patrick,\n\nI came across your portfolio and would love to connect.");

    gmailButton.addEventListener("click", (e) => {
      e.preventDefault();
      if (isMobile) {
        window.location.href = `mailto:${address}?subject=${subject}&body=${body}`;
      } else {
        const compose = new URL("https://mail.google.com/mail/");
        compose.search = `view=cm&fs=1&to=${encodeURIComponent(address)}&su=${subject}&body=${body}`;
        window.open(compose.toString(), "_blank", "noopener");
      }
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });
})();
