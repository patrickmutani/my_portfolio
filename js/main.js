(() => {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme ---------- */
  const themeBtn = document.querySelector(".theme-toggle");
  const metaTheme = document.querySelector('meta[name="theme-color"]');

  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    if (themeBtn) {
      themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
    }
    if (metaTheme) metaTheme.setAttribute("content", theme === "dark" ? "#0a0b0d" : "#f6f6f3");
  };

  applyTheme(root.getAttribute("data-theme") === "light" ? "light" : "dark");

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) { /* private mode */ }
    });
  }

  /* ---------- Header state, progress bar, back-to-top ---------- */
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress");
  const toTop = document.querySelector(".back-to-top");
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    const max = root.scrollHeight - window.innerHeight;
    header.classList.toggle("is-scrolled", y > 8);
    toTop.classList.toggle("is-visible", y > 700);
    progress.style.setProperty("--progress", max > 0 ? Math.min(y / max, 1).toFixed(4) : "0");
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile navigation ---------- */
  const nav = document.getElementById("primary-nav");
  const navToggle = document.querySelector(".nav-toggle");

  const setNav = (open) => {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
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
    // Clear the highlight when back in the hero (or on the résumé band)
    ["top", "resume"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    });
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

  /* ---------- Card spotlight ---------- */
  if (!reduceMotion) {
    document.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Case-study dialogs ---------- */
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
    // A click on the backdrop (outside the content) closes the dialog
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
    const closeBtn = dialog.querySelector(".case-close");
    if (closeBtn) closeBtn.addEventListener("click", () => dialog.close());
  });

  /* ---------- Email: Gmail compose on desktop, mail app on mobile ----------
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
