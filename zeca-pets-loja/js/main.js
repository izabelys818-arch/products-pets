/* =========================================================================
   MAIN — inicialização e seções institucionais
   (avisos, menu, dicas, depoimentos, contato, newsletter, cookies)
   ========================================================================= */
(function (ZP) {
  const { $, $$, esc, icon, stars, storage, toast, openLayer, waLink } = ZP.u;
  const cfg = ZP.config;

  /* ---------- Dados da loja espalhados pela página ---------- */
  function fillStoreInfo() {
    const s = cfg.store;
    const map = {
      phone: s.phone, email: s.email, address: s.address, hours: s.hours, cnpj: s.cnpj,
      instagram: "@" + s.instagram, year: new Date().getFullYear(),
      freeFrom: ZP.u.brl(cfg.shipping.freeFrom), pix: cfg.payment.pixDiscount + "%", installments: cfg.payment.maxInstallments + "x",
    };
    $$("[data-info]").forEach((el) => { el.textContent = map[el.dataset.info] ?? ""; });
    $$("[data-wa]").forEach((el) => { el.href = waLink(el.dataset.wa); el.target = "_blank"; el.rel = "noopener"; });
    $$("[data-mailto]").forEach((el) => { el.href = `mailto:${s.email}`; });
    $$("[data-insta]").forEach((el) => { el.href = `https://instagram.com/${s.instagram}`; el.target = "_blank"; el.rel = "noopener"; });
  }

  /* ---------- Barra de avisos rotativa ---------- */
  function announcements() {
    const el = $("#announce");
    const list = cfg.announcements;
    let i = 0;
    el.textContent = list[0];
    if (list.length < 2 || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setInterval(() => {
      el.classList.add("is-out");
      setTimeout(() => { i = (i + 1) % list.length; el.textContent = list[i]; el.classList.remove("is-out"); }, 300);
    }, 4000);
  }

  /* ---------- Cabeçalho, menu mobile e navegação ativa ---------- */
  function header() {
    const head = $("#header");
    const toTop = $("#toTop");
    const onScroll = () => {
      head.classList.toggle("is-scrolled", scrollY > 10);
      toTop.classList.toggle("is-show", scrollY > 900);
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

    $("#menuBtn").addEventListener("click", () => openLayer("#menuLayer"));
    $("#menuLayer").addEventListener("click", (e) => { if (e.target.closest("a")) ZP.u.closeLayer("#menuLayer"); });

    // Destaca no menu a seção visível
    const links = $$("#mainNav a[href^='#']");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach((a) => { const sec = $(a.getAttribute("href")); if (sec) io.observe(sec); });
  }

  /* ---------- Dicas ---------- */
  function articles() {
    $("#articleGrid").innerHTML = ZP.articles.map((a) => `
      <article class="article-card">
        <button class="article-card__btn" data-article="${a.id}">
          <span class="article-card__cover">${a.emoji}</span>
          <span class="article-card__meta"><span class="tag">${esc(a.tag)}</span> ${icon("clock")} ${a.read} de leitura</span>
          <b>${esc(a.title)}</b>
          <small>${esc(a.excerpt)}</small>
          <span class="article-card__more">Ler dica ${icon("arrow-right")}</span>
        </button>
      </article>`).join("");

    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-article]");
      if (!b) return;
      const a = ZP.articles.find((x) => x.id === b.dataset.article);
      $("#articleContent").innerHTML = `
        <div class="article">
          <span class="article__cover">${a.emoji}</span>
          <p class="article__meta"><span class="tag">${esc(a.tag)}</span> ${icon("clock")} ${a.read} de leitura</p>
          <h2 id="articleTitle">${esc(a.title)}</h2>
          ${a.body.map((p) => `<p>${p}</p>`).join("")}
          <div class="article__cta">
            <p>Ficou com dúvida sobre qual produto usar?</p>
            <a class="btn btn--primary" data-wa="Olá! Li a dica “${esc(a.title)}” e queria uma indicação de produto." href="#">${icon("whatsapp")} Pedir indicação</a>
          </div>
        </div>`;
      fillStoreInfo();
      openLayer("#articleLayer");
    });
  }

  /* ---------- Depoimentos ---------- */
  function testimonials() {
    $("#testimonialGrid").innerHTML = ZP.testimonials.map((t) => `
      <figure class="testimonial">
        ${stars(t.rating)}
        <blockquote>“${esc(t.text)}”</blockquote>
        <figcaption><span class="avatar">${esc(t.name[0])}</span><span><b>${esc(t.name)}</b><small>${esc(t.pet)}</small></span></figcaption>
      </figure>`).join("");
  }

  /* ---------- Formulários ---------- */
  function forms() {
    document.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-copy]");
      if (!b) return;
      try { await navigator.clipboard.writeText(b.dataset.copy); toast(`Cupom ${b.dataset.copy} copiado!`); }
      catch { toast(`Use o cupom ${b.dataset.copy} na sacola`); }
    });

    $("#newsForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const email = $("#newsEmail").value.trim();
      // Sem servidor: o e-mail fica guardado só neste navegador.
      // Para receber inscrições de verdade, conecte o formulário a um serviço de e-mail marketing.
      storage.set("newsletter", email);
      e.target.innerHTML = `<p class="news__ok">${icon("check")} Prontinho! Use o cupom <b>BEMVINDO10</b> na sua primeira compra 💜</p>`;
    });

    $("#contactForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const msg = `Olá, ${cfg.store.name}! Sou ${f.get("name")}.\n*Assunto:* ${f.get("subject")}\n\n${f.get("message")}`;
      window.open(waLink(msg), "_blank", "noopener");
      e.target.reset();
      toast("Abrindo o WhatsApp...");
    });
  }

  /* ---------- Aviso de cookies (LGPD) ---------- */
  function cookies() {
    if (storage.get("cookies-ok", false)) return;
    const bar = $("#cookieBar");
    bar.hidden = false;
    $("#cookieOk").addEventListener("click", () => { storage.set("cookies-ok", true); bar.hidden = true; });
  }

  /* ---------- Inicialização ---------- */
  document.addEventListener("DOMContentLoaded", () => {
    fillStoreInfo();
    announcements();
    ZP.catalog.init();
    ZP.cart.init();
    ZP.checkout.init();
    header();
    articles();
    testimonials();
    forms();
    cookies();
  });
})(window.ZP);
