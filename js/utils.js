/* =========================================================================
   UTILITÁRIOS — helpers de DOM, formatação, armazenamento, toast e camadas
   (drawers/modais com foco preso, Esc para fechar e bloqueio de rolagem)
   ========================================================================= */
window.ZP = window.ZP || {};

(function (ZP) {
  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const icon = (name, cls = "") => `<svg class="i ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const onlyDigits = (s) => String(s).replace(/\D/g, "");

  const debounce = (fn, ms = 200) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  };

  // localStorage pode falhar (aba anônima, bloqueio) — o site continua funcionando sem ele
  const storage = {
    get(key, fallback) {
      try { const v = localStorage.getItem("zp_" + key); return v == null ? fallback : JSON.parse(v); }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("zp_" + key, JSON.stringify(value)); } catch {}
    },
  };

  const stars = (rating) => {
    const full = Math.round(rating);
    return `<span class="stars" aria-label="Nota ${rating.toFixed(1).replace(".", ",")} de 5">` +
      Array.from({ length: 5 }, (_, i) => icon("star", i < full ? "is-on" : "")).join("") + `</span>`;
  };

  const waLink = (text = "") =>
    `https://wa.me/${ZP.config.store.whatsapp}${text ? "?text=" + encodeURIComponent(text) : ""}`;

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(message, type = "ok") {
    const el = $("#toast");
    el.className = `toast toast--${type}`;
    el.innerHTML = `${icon(type === "error" ? "x" : "check")}<span>${esc(message)}</span>`;
    requestAnimationFrame(() => el.classList.add("is-show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-show"), 2400);
  }

  /* ---------- Camadas (drawer / modal) ---------- */
  const stack = [];
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function openLayer(layer) {
    if (typeof layer === "string") layer = $(layer);
    if (stack.some((s) => s.layer === layer)) return;
    stack.push({ layer, opener: document.activeElement });
    layer.hidden = false;
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => requestAnimationFrame(() => layer.classList.add("is-open")));
    const target = $("[autofocus]", layer) || $(".layer__panel", layer);
    setTimeout(() => target && target.focus({ preventScroll: true }), 60);
  }

  function closeLayer(layer) {
    if (typeof layer === "string") layer = $(layer);
    const i = stack.findIndex((s) => s.layer === layer);
    if (i < 0) return;
    const [{ opener }] = stack.splice(i, 1);
    layer.classList.remove("is-open");
    setTimeout(() => { if (!layer.classList.contains("is-open")) layer.hidden = true; }, 280);
    if (!stack.length) document.body.classList.remove("no-scroll");
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    layer.dispatchEvent(new CustomEvent("layer:close"));
  }

  const topLayer = () => stack[stack.length - 1]?.layer;

  document.addEventListener("click", (e) => {
    const closer = e.target.closest("[data-close]");
    if (closer) closeLayer(closer.closest(".layer"));
  });

  document.addEventListener("keydown", (e) => {
    const layer = topLayer();
    if (!layer) return;
    if (e.key === "Escape") { closeLayer(layer); return; }
    if (e.key === "Tab") {
      const items = $$(FOCUSABLE, layer).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  ZP.u = { $, $$, brl, esc, norm, icon, onlyDigits, debounce, storage, stars, waLink, toast, openLayer, closeLayer, topLayer };
})(window.ZP);
