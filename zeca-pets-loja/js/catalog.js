/* =========================================================================
   CATÁLOGO — categorias, pets, filtros, busca, cards, kits e
   página de detalhe do produto (modal com link compartilhável #p/slug)
   ========================================================================= */
window.ZP = window.ZP || {};

(function (ZP) {
  const { $, $$, brl, esc, norm, icon, debounce, stars, toast, openLayer, closeLayer, waLink } = ZP.u;
  const cfg = ZP.config;

  const minPrice = (p) => Math.min(...p.variants.map((v) => v.price));
  const PRICE_CEIL = Math.ceil(Math.max(...ZP.products.map(minPrice)) / 10) * 10;
  const TAGS = { "mais-vendido": "Mais vendido", novo: "Novo", promo: "Oferta" };

  const filters = { cat: "all", pet: "all", q: "", sort: "relevance", promo: false, max: PRICE_CEIL, shown: cfg.pageSize };

  /* ---------- Pedaços reutilizáveis ---------- */
  const petIcons = (p) => p.pets.map((id) => `<span title="${ZP.petById(id).name}">${ZP.petById(id).icon}</span>`).join("");

  function discountPct(v) {
    return v.old ? Math.round((1 - v.price / v.old) * 100) : 0;
  }

  function badges(p, v = p.variants[0]) {
    const list = [];
    if (discountPct(v)) list.push(`<span class="badge badge--sale">-${discountPct(v)}%</span>`);
    p.tags.filter((t) => t !== "promo").forEach((t) => list.push(`<span class="badge badge--${t}">${TAGS[t]}</span>`));
    return list.length ? `<div class="badges">${list.join("")}</div>` : "";
  }

  function priceBlock(p, v = p.variants[0], { from = p.variants.length > 1 } = {}) {
    const inst = ZP.pricing.installments(v.price);
    return `
      <div class="price">
        ${v.old ? `<s class="price__old">${brl(v.old)}</s>` : ""}
        <div class="price__now">${from ? "<small>a partir de</small>" : ""}<b>${brl(v.price)}</b></div>
        <div class="price__pix">${icon("pix")} ${brl(ZP.pricing.pixPrice(v.price))} no Pix</div>
        ${inst.n > 1 ? `<div class="price__inst">ou ${inst.n}x de ${brl(inst.each)} sem juros</div>` : ""}
      </div>`;
  }

  function favButton(p, extra = "") {
    const on = ZP.store.isFav(p.id);
    return `<button class="fav-btn ${extra} ${on ? "is-on" : ""}" data-fav="${p.id}" aria-pressed="${on}" aria-label="${on ? "Remover dos" : "Adicionar aos"} favoritos: ${esc(p.name)}">${icon("heart")}</button>`;
  }

  function card(p) {
    const cat = ZP.catById(p.cat);
    return `
      <article class="product-card">
        <div class="product-card__media" style="--tint:${cat.tint}">
          ${badges(p)}
          ${favButton(p)}
          <button class="product-card__img" data-open="${p.id}" aria-label="Ver detalhes: ${esc(p.name)}">${ZP.art.product(p)}</button>
          <button class="product-card__quick" data-open="${p.id}" tabindex="-1">${icon("eye")} Ver detalhes</button>
        </div>
        <div class="product-card__body">
          <div class="product-card__meta"><span>${cat.name}</span><span class="pets">${petIcons(p)}</span></div>
          <h3 class="product-card__title"><a href="#p/${p.slug}">${esc(p.name)}</a></h3>
          <div class="product-card__rating">${stars(p.rating)}<small>(${p.reviews})</small></div>
          ${priceBlock(p)}
          <button class="btn btn--primary btn--block" data-quickadd="${p.id}">${icon("bag")} Adicionar</button>
        </div>
      </article>`;
  }

  function miniCard(p) {
    const v = p.variants[0];
    return `
      <div class="mini-card">
        <button class="mini-card__img" data-open="${p.id}" style="--tint:${ZP.catById(p.cat).tint}" aria-label="Ver ${esc(p.name)}">${ZP.art.product(p)}</button>
        <div class="mini-card__info">
          <button class="mini-card__name" data-open="${p.id}">${esc(p.name)}</button>
          <b>${brl(v.price)}</b>
        </div>
        <button class="icon-btn icon-btn--soft" data-quickadd="${p.id}" aria-label="Adicionar ${esc(p.name)} à sacola">${icon("plus")}</button>
      </div>`;
  }

  /* ---------- Seções de vitrine ---------- */
  function renderCategories() {
    $("#categoryGrid").innerHTML = ZP.categories.map((c) => {
      const n = ZP.products.filter((p) => p.cat === c.id).length;
      return `
        <button class="category-card" data-go-cat="${c.id}" style="--tint:${c.tint}">
          <span class="category-card__icon">${c.icon}</span>
          <b>${c.name}</b>
          <small>${c.desc}</small>
          <span class="category-card__count">${n} produtos ${icon("arrow-right")}</span>
        </button>`;
    }).join("");
  }

  function renderPets() {
    $("#petGrid").innerHTML = ZP.pets.map((pet) => {
      const n = ZP.products.filter((p) => p.pets.includes(pet.id)).length;
      return `
        <button class="pet-card" data-go-pet="${pet.id}">
          <span class="pet-card__icon">${pet.icon}</span>
          <b>${pet.name}</b><small>${n} produtos</small>
        </button>`;
    }).join("");
  }

  function renderKits() {
    $("#kitGrid").innerHTML = ZP.products.filter((p) => p.cat === "kits").map(card).join("");
  }

  /* ---------- Filtros ---------- */
  function renderFilterControls() {
    $("#filterChips").innerHTML = [{ id: "all", name: "Todos" }, ...ZP.categories].map((c) => {
      const n = c.id === "all" ? ZP.products.length : ZP.products.filter((p) => p.cat === c.id).length;
      const on = filters.cat === c.id;
      return `<button class="chip ${on ? "is-active" : ""}" data-filter-cat="${c.id}" aria-pressed="${on}">${c.name} <small>${n}</small></button>`;
    }).join("");

    $("#petFilter").innerHTML = `<option value="all">Todos os pets</option>` +
      ZP.pets.map((p) => `<option value="${p.id}" ${filters.pet === p.id ? "selected" : ""}>${p.icon} ${p.name}</option>`).join("");

    const range = $("#priceMax");
    range.max = PRICE_CEIL;
    range.value = filters.max;
    $("#priceMaxLabel").textContent = filters.max >= PRICE_CEIL ? "Qualquer preço" : `Até ${brl(filters.max)}`;
    $("#promoOnly").checked = filters.promo;
    $("#sortSelect").value = filters.sort;
  }

  function matches(p, tokens) {
    const hay = norm([p.name, p.short, ZP.catById(p.cat).name, ...p.pets.map((id) => ZP.petById(id).name)].join(" "));
    return tokens.every((t) => hay.includes(t));
  }

  function filtered() {
    const tokens = norm(filters.q).split(/\s+/).filter(Boolean);
    const list = ZP.products.filter((p) =>
      (filters.cat === "all" || p.cat === filters.cat) &&
      (filters.pet === "all" || p.pets.includes(filters.pet)) &&
      (!filters.promo || p.variants.some((v) => v.old)) &&
      minPrice(p) <= filters.max &&
      (!tokens.length || matches(p, tokens)));

    const score = (p) => (p.tags.includes("mais-vendido") ? 3 : 0) + (p.tags.includes("promo") ? 1 : 0) + p.rating;
    const sorters = {
      relevance: (a, b) => score(b) - score(a),
      rating: (a, b) => b.rating - a.rating || b.reviews - a.reviews,
      "price-asc": (a, b) => minPrice(a) - minPrice(b),
      "price-desc": (a, b) => minPrice(b) - minPrice(a),
      newest: (a, b) => (b.tags.includes("novo") - a.tags.includes("novo")) || b.id - a.id,
      discount: (a, b) => discountPct(b.variants[0]) - discountPct(a.variants[0]),
    };
    return list.sort(sorters[filters.sort]);
  }

  function renderActiveFilters() {
    const pills = [];
    if (filters.q) pills.push(["q", `Busca: “${esc(filters.q)}”`]);
    if (filters.cat !== "all") pills.push(["cat", ZP.catById(filters.cat).name]);
    if (filters.pet !== "all") pills.push(["pet", `${ZP.petById(filters.pet).icon} ${ZP.petById(filters.pet).name}`]);
    if (filters.promo) pills.push(["promo", "Em oferta"]);
    if (filters.max < PRICE_CEIL) pills.push(["max", `Até ${brl(filters.max)}`]);
    $("#activeFilters").innerHTML = pills.map(([k, label]) =>
      `<button class="pill" data-clear="${k}" aria-label="Remover filtro ${label}">${label} ${icon("x")}</button>`).join("") +
      (pills.length > 1 ? `<button class="pill pill--ghost" data-clear="all">Limpar tudo</button>` : "");
  }

  function renderGrid() {
    const list = filtered();
    const visible = list.slice(0, filters.shown);
    $("#resultCount").textContent = `${list.length} ${list.length === 1 ? "produto" : "produtos"}`;
    $("#productGrid").innerHTML = visible.map(card).join("");
    $("#emptyState").hidden = list.length > 0;
    const more = $("#loadMore");
    more.hidden = list.length <= filters.shown;
    more.textContent = `Carregar mais (${list.length - visible.length})`;
    renderActiveFilters();
  }

  function update(changes, { scroll = false } = {}) {
    Object.assign(filters, changes, { shown: cfg.pageSize });
    renderFilterControls();
    renderGrid();
    if (scroll) $("#produtos").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const clearers = {
    q: () => { $("#searchInput").value = ""; return { q: "" }; },
    cat: () => ({ cat: "all" }),
    pet: () => ({ pet: "all" }),
    promo: () => ({ promo: false }),
    max: () => ({ max: PRICE_CEIL }),
    all: () => { $("#searchInput").value = ""; return { q: "", cat: "all", pet: "all", promo: false, max: PRICE_CEIL }; },
  };

  /* ---------- Busca com sugestões ---------- */
  function renderSuggestions() {
    const q = $("#searchInput").value.trim();
    const box = $("#searchSuggest");
    if (q.length < 2) { box.hidden = true; return; }
    const tokens = norm(q).split(/\s+/).filter(Boolean);
    const found = ZP.products.filter((p) => matches(p, tokens));
    box.innerHTML = (found.length
      ? found.slice(0, 5).map((p) => `
          <li><button type="button" class="suggest" data-open="${p.id}">
            <span class="suggest__img" style="--tint:${ZP.catById(p.cat).tint}">${ZP.art.product(p)}</span>
            <span class="suggest__name">${esc(p.name)}<small>${ZP.catById(p.cat).name}</small></span>
            <b>${brl(minPrice(p))}</b>
          </button></li>`).join("") +
        `<li><button type="submit" class="suggest suggest--all">Ver todos os ${found.length} resultados ${icon("arrow-right")}</button></li>`
      : `<li class="suggest suggest--none">Nada encontrado para “${esc(q)}”. Tente “shampoo” ou “gatos”.</li>`);
    box.hidden = false;
  }

  function hideSuggestions() { $("#searchSuggest").hidden = true; }

  /* ---------- Detalhe do produto ---------- */
  const detail = { id: null, v: 0, qty: 1 };

  function related(p) {
    return ZP.products
      .filter((x) => x.id !== p.id && x.pets.some((pet) => p.pets.includes(pet)))
      .sort((a, b) => (a.cat === p.cat) - (b.cat === p.cat) || b.rating - a.rating)
      .slice(0, 4);
  }

  function renderDetail() {
    const p = ZP.byId(detail.id);
    const cat = ZP.catById(p.cat);
    const v = p.variants[detail.v];
    const pets = p.pets.map((id) => ZP.petById(id)).map((x) => `${x.icon} ${x.name}`).join(" · ");

    $("#productContent").innerHTML = `
      <div class="pd">
        <div class="pd__media" style="--tint:${cat.tint}">${badges(p, v)}${ZP.art.product(p)}</div>
        <div class="pd__info">
          <p class="pd__crumbs"><button data-go-cat="${cat.id}">${cat.name}</button> <span>·</span> ${pets}</p>
          <h2 class="pd__title" id="productTitle">${esc(p.name)}</h2>
          <div class="pd__rating">${stars(p.rating)} <b>${p.rating.toFixed(1).replace(".", ",")}</b> <small>(${p.reviews} avaliações)</small></div>
          <p class="pd__short">${esc(p.short)}</p>

          ${p.variants.length > 1 ? `
            <div class="pd__variants" role="radiogroup" aria-label="Escolha o tamanho">
              ${p.variants.map((x, i) => `<button role="radio" aria-checked="${i === detail.v}" class="variant ${i === detail.v ? "is-active" : ""}" data-variant="${i}">${x.label}<small>${brl(x.price)}</small></button>`).join("")}
            </div>` : `<p class="pd__size">Tamanho: <b>${v.label}</b></p>`}

          ${priceBlock(p, v, { from: false })}

          <div class="pd__buy">
            <div class="stepper" aria-label="Quantidade">
              <button data-pd-qty="-1" aria-label="Diminuir">${icon("minus")}</button>
              <output id="pdQty" aria-live="polite">${detail.qty}</output>
              <button data-pd-qty="1" aria-label="Aumentar">${icon("plus")}</button>
            </div>
            <button class="btn btn--primary btn--lg" id="pdAdd">${icon("bag")} Adicionar · ${brl(v.price * detail.qty)}</button>
            ${favButton(p, "fav-btn--lg")}
          </div>

          <ul class="pd__perks">
            <li>${icon("truck")} Frete grátis acima de ${brl(cfg.shipping.freeFrom)}</li>
            <li>${icon("shield")} Compra segura e troca garantida</li>
            <li>${icon("chat")} <a href="${waLink(`Olá! Tenho uma dúvida sobre o produto ${p.name}.`)}" target="_blank" rel="noopener">Tirar dúvida no WhatsApp</a></li>
          </ul>

          <div class="pd__details">
            <details open><summary>Descrição</summary><p>${esc(p.description)}</p></details>
            <details><summary>Benefícios</summary><ul class="check-list">${p.benefits.map((b) => `<li>${icon("check")} ${esc(b)}</li>`).join("")}</ul></details>
            <details><summary>Modo de uso</summary><p>${esc(p.howTo)}</p></details>
            <details><summary>Indicado para</summary><p>${pets}</p></details>
          </div>
          <button class="link-btn" data-share="${p.id}">${icon("share")} Compartilhar produto</button>
        </div>
      </div>
      <div class="pd__related">
        <h3>Combina com</h3>
        <div class="mini-grid">${related(p).map(miniCard).join("")}</div>
      </div>`;
  }

  function openProduct(id, { fromHash = false } = {}) {
    const p = ZP.byId(id);
    if (!p) return;
    hideSuggestions();
    Object.assign(detail, { id, v: 0, qty: 1 });
    renderDetail();
    if (!fromHash) history.replaceState(null, "", `#p/${p.slug}`);
    document.title = `${p.name} — ${cfg.store.name}`;
    const layer = $("#productLayer");
    if (layer.hidden) openLayer(layer);
    else $(".layer__panel", layer).scrollTop = 0;
  }

  function onHash() {
    const m = location.hash.match(/^#p\/([\w-]+)/);
    if (m && ZP.bySlug(m[1])) openProduct(ZP.bySlug(m[1]).id, { fromHash: true });
  }

  async function share(p) {
    const url = `${location.href.split("#")[0]}#p/${p.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: p.name, text: p.short, url });
      else { await navigator.clipboard.writeText(url); toast("Link copiado!"); }
    } catch {}
  }

  /* ---------- Eventos ---------- */
  function bump() {
    const btn = $("#cartBtn");
    btn.classList.remove("is-bump");
    void btn.offsetWidth;
    btn.classList.add("is-bump");
  }

  function addToCart(id, v = 0, qty = 1) {
    ZP.store.add(id, v, qty);
    bump();
    toast(`${ZP.byId(id).name} na sacola!`);
  }

  function bind() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-open],[data-quickadd],[data-fav],[data-go-cat],[data-go-pet],[data-filter-cat],[data-clear],[data-variant],[data-pd-qty],[data-share],#pdAdd,#loadMore");
      if (!t) return;
      const d = t.dataset;

      if (d.open) { e.preventDefault(); openProduct(+d.open); }
      else if (d.quickadd) addToCart(+d.quickadd);
      else if (d.fav) {
        const on = ZP.store.toggleFav(+d.fav);
        toast(on ? "Adicionado aos favoritos 💜" : "Removido dos favoritos");
      }
      else if (d.goCat) { closeLayer("#productLayer"); update({ cat: d.goCat }, { scroll: true }); }
      else if (d.goPet) update({ pet: d.goPet }, { scroll: true });
      else if (d.filterCat) update({ cat: d.filterCat });
      else if (d.clear) update(clearers[d.clear]());
      else if (d.variant) { detail.v = +d.variant; renderDetail(); $(`[data-variant="${d.variant}"]`).focus(); }
      else if (d.pdQty) { detail.qty = Math.max(1, Math.min(99, detail.qty + +d.pdQty)); renderDetail(); $(`[data-pd-qty="${d.pdQty}"]`).focus(); }
      else if (d.share) share(ZP.byId(+d.share));
      else if (t.id === "pdAdd") { addToCart(detail.id, detail.v, detail.qty); closeLayer("#productLayer"); }
      else if (t.id === "loadMore") { filters.shown += cfg.pageSize; renderGrid(); }
    });

    // Links “#p/slug” dentro dos cards
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#p/"]');
      if (!a) return;
      e.preventDefault();
      const p = ZP.bySlug(a.getAttribute("href").slice(3));
      if (p) openProduct(p.id);
    });

    $("#petFilter").addEventListener("change", (e) => update({ pet: e.target.value }));
    $("#sortSelect").addEventListener("change", (e) => update({ sort: e.target.value }));
    $("#promoOnly").addEventListener("change", (e) => update({ promo: e.target.checked }));
    $("#priceMax").addEventListener("input", (e) => {
      filters.max = +e.target.value;
      filters.shown = cfg.pageSize;
      $("#priceMaxLabel").textContent = filters.max >= PRICE_CEIL ? "Qualquer preço" : `Até ${brl(filters.max)}`;
      renderGrid();
    });

    const input = $("#searchInput");
    input.addEventListener("input", debounce(renderSuggestions, 120));
    input.addEventListener("focus", renderSuggestions);
    $("#searchForm").addEventListener("submit", (e) => {
      e.preventDefault();
      hideSuggestions();
      input.blur();
      update({ q: input.value.trim() }, { scroll: true });
    });
    document.addEventListener("click", (e) => { if (!e.target.closest("#searchForm")) hideSuggestions(); });
    input.addEventListener("keydown", (e) => { if (e.key === "Escape") hideSuggestions(); });

    $("#productLayer").addEventListener("layer:close", () => {
      if (location.hash.startsWith("#p/")) history.replaceState(null, "", location.pathname + location.search);
      document.title = ZP.baseTitle;
    });
    window.addEventListener("hashchange", onHash);

    // Mantém corações e preços sincronizados com o estado
    ZP.store.subscribe((change) => {
      if (change.type !== "favs") return;
      $$(`[data-fav="${change.id}"]`).forEach((b) => {
        b.classList.toggle("is-on", change.on);
        b.setAttribute("aria-pressed", change.on);
      });
    });
  }

  ZP.catalog = {
    init() {
      ZP.baseTitle = document.title;
      renderCategories();
      renderPets();
      renderKits();
      renderFilterControls();
      renderGrid();
      bind();
      onHash();
    },
    card, miniCard, openProduct, addToCart,
  };
})(window.ZP);
