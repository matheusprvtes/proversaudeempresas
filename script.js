/* =========================================================
   Prover Saúde — LP Empresas (Corporate Care Pass) · Interações
   Degradação elegante: sem este JS o conteúdo e os CTAs
   continuam funcionando (todos os links de WhatsApp já têm
   o href completo definido no HTML).
   ========================================================= */

/* ---------------------------------------------------------
   CONTATO — EDITE AQUI (WhatsApp comercial Prover Saúde)
   DDI + DDD + número, só dígitos. Ex.: 5567999998888
   Ao alterar aqui, atualize também o href dos CTAs no index.html
   (eles trazem o link pronto para funcionar sem JS).
--------------------------------------------------------- */
var CONTACT = {
  whats: "5567999225671", // WhatsApp da equipe Prover Saúde — +55 (67) 9 9922-5671
  msg: "Olá! Gostaria de conhecer as modalidades empresariais do Sistema Prover Saúde."
};

(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Links de WhatsApp ---- */
  function waLink(msg) {
    return "https://wa.me/" + CONTACT.whats + "?text=" + encodeURIComponent(msg || CONTACT.msg);
  }
  document.querySelectorAll("[data-wa]").forEach(function (el) {
    el.setAttribute("href", waLink());
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");
  });

  /* ---- Ano do rodapé ---- */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* ---- Navbar: estado ao rolar + CTA fixo no mobile ---- */
  var nav = document.getElementById("nav");
  var sticky = document.getElementById("stickyCta");
  function onScroll() {
    if (nav) nav.setAttribute("data-state", window.scrollY > 12 ? "scrolled" : "top");
    if (sticky) {
      var show = window.scrollY > 480;
      sticky.classList.toggle("is-visible", show);
      sticky.setAttribute("aria-hidden", show ? "false" : "true");
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Menu mobile ---- */
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("navMenu");
  function closeMenu() {
    if (!nav) return;
    nav.classList.remove("is-open");
    if (toggle) { toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Abrir menu"); }
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---- Scrollspy (link ativo) ---- */
  var ids = ["corporate", "beneficios", "vantagens", "duvidas"];
  var secs = ids.map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var links = {};
  if (menu) menu.querySelectorAll('a[href^="#"]').forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  if ("IntersectionObserver" in window && secs.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = links[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove("is-active"); });
          link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secs.forEach(function (s) { spy.observe(s); });
  }

  /* ---- Banner de cookies (LGPD) ---- */
  var cookie = document.getElementById("cookie");
  var KEY = "prover_empresas_cookie_consent";
  try { if (cookie && !localStorage.getItem(KEY)) setTimeout(function () { cookie.hidden = false; }, 1200); } catch (e) {}
  function setConsent(v) { try { localStorage.setItem(KEY, v); } catch (e) {} if (cookie) cookie.hidden = true; }
  var acc = document.getElementById("cookieAccept");
  var dec = document.getElementById("cookieDecline");
  if (acc) acc.addEventListener("click", function () { setConsent("accepted"); });
  if (dec) dec.addEventListener("click", function () { setConsent("declined"); });

  /* ---- Hook de tracking para CTAs ---- */
  document.querySelectorAll("[data-cta], [data-wa]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-cta") || "whatsapp";
      if (window.dataLayer) window.dataLayer.push({ event: "cta_click", cta: id });
    });
  });

  /* ---- Carrossel (uma imagem por vez, loop infinito) ---- */
  document.querySelectorAll(".carousel").forEach(function (car) {
    var slides = Array.prototype.slice.call(car.querySelectorAll(".carousel__slide"));
    if (slides.length < 2) return;
    var dots = Array.prototype.slice.call(car.querySelectorAll(".carousel__dot"));
    var idx = 0, timer = null, DELAY = 3800;
    function show(n) {
      idx = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === idx); });
      dots.forEach(function (d, k) { d.classList.toggle("is-active", k === idx); d.setAttribute("aria-selected", k === idx ? "true" : "false"); });
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function start() { if (!reduce) { stop(); timer = setInterval(function () { show(idx + 1); }, DELAY); } }
    dots.forEach(function (d, k) { d.addEventListener("click", function () { show(k); start(); }); });
    car.addEventListener("mouseenter", stop);
    car.addEventListener("mouseleave", start);
    show(0);
    start();
  });
})();
