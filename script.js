/* =========================================================
   Prover Saúde — LP Empresas (Corporate Care Pass) · Interações
   Degradação elegante: sem este JS o conteúdo e os CTAs
   continuam funcionando (o pop-up de contato abre por :target
   e todos os links já têm href definido no HTML).
   ========================================================= */

/* ---------------------------------------------------------
   CONTATO — EDITE AQUI (WhatsApp comercial Prover Saúde)
   DDI + DDD + número, só dígitos. Ex.: 5567999998888
--------------------------------------------------------- */
var CONTACT = {
  whats: "5567999338803", // WhatsApp da equipe Prover Saúde — +55 (67) 9 9933-8803
  msg: "Olá! Quero saber como funciona o Corporate Care Pass da Prover Saúde para a minha empresa!"
};

/* ---------------------------------------------------------
   RD STATION — EDITE AQUI
   apiKey: "Chave de API pública" da conta
           (RD Station Marketing > Integrações > API > Chave pública).
   Enquanto estiver em branco, o envio é ignorado em silêncio e o
   formulário continua funcionando normalmente.
--------------------------------------------------------- */
var RD = {
  apiKey: "",
  conversionId: "lp-empresas-prover-saude" // nome da conversão no RD
};

/* ---------------------------------------------------------
   reCAPTCHA v3 (invisível) — EDITE AQUI
   Cole a "Chave do site" gerada em google.com/recaptcha (v3).
   Com a chave preenchida, o script do Google é carregado sozinho
   e cada envio leva um token em "recaptcha_token" para o n8n
   validar no backend (endpoint siteverify + chave secreta).
   Em branco, o formulário segue funcionando com honeypot +
   sanitização, sem nenhuma chamada ao Google.
--------------------------------------------------------- */
var RECAPTCHA = {
  siteKey: "",
  action: "lead_empresas"
};

/* ---------------------------------------------------------
   WEBHOOK (n8n) — recebe todos os dados do formulário
--------------------------------------------------------- */
var WEBHOOK = {
  url: "https://n-8-n-n8n.rdbtlj.easypanel.host/webhook/4ea0d518-3bbe-49cc-989f-6ca23946f88c",
  origem: "lp-empresas-prover-saude"
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

  /* ---- Selects: label flutuante ---- */
  document.querySelectorAll(".field select").forEach(function (sel) {
    function upd() { sel.classList.toggle("has-value", !!sel.value); }
    sel.addEventListener("change", upd);
    upd();
  });

  /* ---- Envio da conversão para o RD Station ---- */
  function readCookie(name) {
    var m = document.cookie.match(new RegExp("(^|; )" + name.replace(/\./g, "\\.") + "=([^;]*)"));
    return m ? decodeURIComponent(m[2]) : null;
  }
  function sendToRD(fields) {
    if (!RD.apiKey || typeof window.fetch !== "function") return;
    var payload = { conversion_identifier: RD.conversionId };
    Object.keys(fields).forEach(function (k) {
      if (fields[k]) payload[k] = fields[k];
    });
    // Origem do tráfego registrada pelo loader do RD (atribuição de canal/UTM)
    var trf = readCookie("__trf.src");
    if (trf) payload.traffic_source = trf;

    fetch("https://api.rd.services/platform/conversions?api_key=" + encodeURIComponent(RD.apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "CONVERSION", event_family: "CDP", payload: payload }),
      keepalive: true
    }).catch(function () { /* falha de rede não bloqueia o usuário */ });
  }

  /* ---- Envio dos dados do formulário para o webhook (n8n) ---- */
  function utmParams() {
    var out = {};
    try {
      var q = new URLSearchParams(window.location.search);
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"].forEach(function (k) {
        var v = q.get(k);
        if (v) out[k] = v;
      });
    } catch (e) {}
    return out;
  }
  // Id único do envio: se o fallback por sendBeacon chegar a disparar, o n8n
  // consegue identificar (e descartar) a duplicata pelo mesmo lead_id.
  function leadId() {
    try {
      if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    } catch (e) {}
    return "lead-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
  }
  function sendToWebhook(fields) {
    if (!WEBHOOK.url) return Promise.resolve();
    var data = {
      origem: WEBHOOK.origem,
      conversion_identifier: RD.conversionId,
      lead_id: leadId(),
      pagina: window.location.href,
      enviado_em: new Date().toISOString()
    };
    Object.keys(fields).forEach(function (k) { data[k] = fields[k]; });
    var utm = utmParams();
    Object.keys(utm).forEach(function (k) { data[k] = utm[k]; });
    var trf = readCookie("__trf.src");
    if (trf) data.traffic_source = trf;

    var body = JSON.stringify(data);
    function beacon() {
      try {
        if (navigator.sendBeacon) {
          return navigator.sendBeacon(WEBHOOK.url, new Blob([body], { type: "text/plain;charset=UTF-8" }));
        }
      } catch (e) {}
      return false;
    }
    if (typeof window.fetch === "function") {
      // "no-cors" + text/plain: requisição simples, sem preflight. O webhook
      // recebe o JSON no corpo e a promise não é rejeitada só porque o n8n
      // não devolve cabeçalho CORS — é isso que evitava o envio duplicado
      // (fetch entregue + sendBeacon de fallback gerando dois leads).
      return fetch(WEBHOOK.url, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: body,
        keepalive: true
      }).catch(function () {
        // Falha real de rede: aí sim vale a tentativa pelo sendBeacon
        if (!beacon()) throw new Error("envio falhou");
      });
    }
    if (!beacon()) return Promise.reject(new Error("envio falhou"));
    return Promise.resolve();
  }

  /* ---- reCAPTCHA v3 (invisível, sem fricção para o usuário) ---- */
  function loadRecaptcha() {
    if (!RECAPTCHA.siteKey || document.getElementById("recaptcha-v3")) return;
    var s = document.createElement("script");
    s.id = "recaptcha-v3";
    s.async = true;
    s.src = "https://www.google.com/recaptcha/api.js?render=" + encodeURIComponent(RECAPTCHA.siteKey);
    document.head.appendChild(s);
  }
  loadRecaptcha();
  // Resolve sempre: uma falha do Google nunca pode travar o envio do lead
  function recaptchaToken() {
    return new Promise(function (resolve) {
      if (!RECAPTCHA.siteKey || !window.grecaptcha || !window.grecaptcha.ready) return resolve("");
      var done = false;
      var finish = function (t) { if (!done) { done = true; resolve(t || ""); } };
      setTimeout(function () { finish(""); }, 3000);
      try {
        window.grecaptcha.ready(function () {
          window.grecaptcha.execute(RECAPTCHA.siteKey, { action: RECAPTCHA.action }).then(finish, function () { finish(""); });
        });
      } catch (e) { finish(""); }
    });
  }

  /* ---- Formulário de captura ---- */
  var form = document.getElementById("lead-form");
  if (form) {
    var whats = form.querySelector("#whats");
    var nome = form.querySelector("#nome");
    var empresa = form.querySelector("#empresa");
    var colab = form.querySelector("#colaboradores");
    var email = form.querySelector("#email");
    var consent = form.querySelector("#consent");

    function sanitize(v) {
      // Remove tags e caracteres de controle antes de enviar ao CRM (prevenção de XSS/injeção)
      return String(v || "").replace(/<[^>]*>/g, "").replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, 200);
    }
    function mark(input, ok) {
      var f = input.closest(".field");
      if (!f) return;
      f.classList.toggle("field--error", !ok);
      f.classList.toggle("field--ok", ok);
    }
    function validName(v) { return sanitize(v).length >= 3 && /\s/.test(sanitize(v)); }
    function validText(v) { return sanitize(v).length >= 2; }
    function validPhone(v) { return v.replace(/\D/g, "").length >= 10; }
    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }

    var CHECKS = [
      [nome, validName],
      [empresa, validText],
      [colab, function (v) { return !!v; }],
      [whats, validPhone],
      [email, validEmail]
    ];

    // Máscara simples de telefone
    if (whats) {
      whats.addEventListener("input", function () {
        var d = whats.value.replace(/\D/g, "").slice(0, 11);
        var out = d;
        if (d.length > 2) out = "(" + d.slice(0, 2) + ") " + d.slice(2);
        if (d.length > 7) out = "(" + d.slice(0, 2) + ") " + d.slice(2, 7) + "-" + d.slice(7);
        whats.value = out;
      });
    }

    // Validação inline: valida enquanto digita (só depois do primeiro blur, para não acusar erro cedo demais)
    CHECKS.forEach(function (pair) {
      var el = pair[0], test = pair[1];
      if (!el) return;
      var touched = false;
      function run() { if (touched) mark(el, test(el.value)); }
      el.addEventListener("blur", function () { touched = true; run(); });
      el.addEventListener("input", run);
      el.addEventListener("change", function () { touched = true; run(); });
    });

    if (consent) {
      consent.addEventListener("change", function () {
        consent.closest(".consent").style.color = consent.checked ? "" : "#d33";
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      // Honeypot: se preenchido, é bot -> ignora silenciosamente
      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value.trim() !== "") return;

      form.classList.remove("has-error");

      var ok = true;
      CHECKS.forEach(function (pair) {
        var el = pair[0], test = pair[1];
        if (!el) return;
        var valid = test(el.value);
        mark(el, valid);
        ok = ok && valid;
      });
      if (!consent.checked) { ok = false; consent.closest(".consent").style.color = "#d33"; }
      else { consent.closest(".consent").style.color = ""; }

      if (!ok) {
        var firstErr = form.querySelector(".field--error input, .field--error select");
        if (firstErr) firstErr.focus();
        return;
      }

      // Tracking (Meta/GA/GTM)
      if (window.dataLayer) window.dataLayer.push({ event: "lead_form_submit" });
      if (typeof window.fbq === "function") window.fbq("track", "Lead");

      // RD Station (campos padrão do lead)
      sendToRD({
        email: email.value.trim(),
        name: sanitize(nome.value),
        personal_phone: whats.value.trim(),
        company_name: sanitize(empresa.value),
        cf_numero_colaboradores: colab.value
      });

      // Webhook n8n (todos os campos do formulário + token do reCAPTCHA)
      recaptchaToken().then(function (token) {
        return sendToWebhook({
          nome: sanitize(nome.value),
          empresa: sanitize(empresa.value),
          colaboradores: colab.value,
          email: sanitize(email.value),
          whatsapp: whats.value.trim(),
          whatsapp_e164: "55" + whats.value.replace(/\D/g, ""),
          consentimento_lgpd: true,
          recaptcha_token: token,
          recaptcha_action: token ? RECAPTCHA.action : ""
        });
      }).catch(function () {
        // Falha real de envio: mensagem amigável, sem expor erro cru
        form.classList.add("has-error");
      });

      // Sucesso (UI) + redirecionamento automático para o WhatsApp com a
      // mensagem pronta. Os dados do lead vão pelo webhook/RD Station —
      // a mensagem leva apenas o texto padrão.
      form.classList.add("is-sent");
      setTimeout(function () {
        var win = window.open(waLink(), "_blank");
        if (win) { try { win.opener = null; } catch (e) {} }
        else { window.location.href = waLink(); } // pop-up bloqueado: redireciona na mesma aba
      }, 900);
    });
  }

  /* ---- Pop-up de contato (formulário) ---- */
  var modal = document.getElementById("adesao");
  if (modal) {
    var lastFocus = null;
    var openModal = function (e) {
      if (e) e.preventDefault();
      lastFocus = document.activeElement;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.documentElement.classList.add("modal-open");
      setTimeout(function () {
        var f = modal.querySelector("#nome") || modal.querySelector("input, select, button");
        if (f) f.focus();
      }, 80);
    };
    var closeModal = function () {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.documentElement.classList.remove("modal-open");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    // Abrir: todos os CTAs que apontam para #adesao, exceto os de WhatsApp
    document.querySelectorAll('a[href="#adesao"]:not([data-wa])').forEach(function (a) {
      a.addEventListener("click", openModal);
    });
    modal.querySelectorAll("[data-modal-close]").forEach(function (b) {
      b.addEventListener("click", closeModal);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
    });
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
