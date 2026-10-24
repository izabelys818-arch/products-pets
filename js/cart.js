/* =========================================================================
   SACOLA E FAVORITOS — gavetas laterais, cupom, barra de frete grátis
   e sugestões de compra
   ========================================================================= */
window.ZP = window.ZP || {};

(function (ZP) {
  const { $, brl, esc, icon, toast, openLayer, closeLayer } = ZP.u;
  const cfg = ZP.config;

  /* ---------- Contadores do cabeçalho ---------- */
  function renderCounts() {
    const n = ZP.store.count();
    const f = ZP.store.state.favs.length;
    $("#cartCount").textContent = n;
    $("#cartCount").hidden = n === 0;
    $("#favCount").textContent = f;
    $("#favCount").hidden = f === 0;
    $("#cartBtn").setAttribute("aria-label", `Abrir sacola (${n} ${n === 1 ? "item" : "itens"})`);
  }

  /* ---------- Sacola ---------- */
  function freeShippingBar(t) {
    if (!t.lines.length) return "";
    const msg = t.freeShip
      ? `${icon("check")} <span>Oba! Você ganhou <b>frete grátis</b>.</span>`
      : `${icon("truck")} <span>Faltam <b>${brl(t.missingForFree)}</b> para o <b>frete grátis</b>.</span>`;
    const pct = t.freeShip ? 100 : Math.round(t.freeProgress * 100);
    return `<div class="ship-bar ${t.freeShip ? "is-done" : ""}">
      <p>${msg}</p><div class="ship-bar__track"><span style="width:${pct}%"></span></div></div>`;
  }

  function lineHTML(l) {
    const { p, variant } = l;
    return `
      <li class="cart-line">
        <button class="cart-line__img" data-open="${p.id}" style="--tint:${ZP.catById(p.cat).tint}" aria-label="Ver ${esc(p.name)}">${ZP.art.product(p)}</button>
        <div class="cart-line__info">
          <button class="cart-line__name" data-open="${p.id}">${esc(p.name)}</button>
          <small>${variant.label} · ${brl(variant.price)}</small>
          <div class="cart-line__actions">
            <div class="stepper stepper--sm">
              <button data-line-qty="${p.id}:${l.v}:-1" aria-label="Diminuir">${icon("minus")}</button>
              <output>${l.qty}</output>
              <button data-line-qty="${p.id}:${l.v}:1" aria-label="Aumentar">${icon("plus")}</button>
            </div>
            <button class="link-btn link-btn--danger" data-line-remove="${p.id}:${l.v}">${icon("trash")} Remover</button>
          </div>
        </div>
        <b class="cart-line__total">${brl(l.total)}</b>
      </li>`;
  }

  function upsell() {
    const inCart = new Set(ZP.store.state.cart.map((l) => l.id));
    const picks = ZP.products
      .filter((p) => !inCart.has(p.id) && p.cat !== "kits" && p.variants[0].price <= 40)
      .sort((a, b) => b.reviews - a.reviews)
      .slice(0, 3);
    return picks.length ? `<div class="upsell"><h3>Aproveite também</h3><div class="mini-grid mini-grid--stack">${picks.map(ZP.catalog.miniCard).join("")}</div></div>` : "";
  }

  function couponHTML(t) {
    const code = ZP.store.state.coupon;
    if (code) {
      return `<div class="coupon coupon--applied ${t.couponError ? "is-warn" : ""}">
        ${icon("tag")}<div><b>${esc(code)}</b><small>${t.couponError ? esc(t.couponError) : esc(cfg.coupons[code].label)}</small></div>
        <button class="link-btn" data-coupon-remove>Remover</button></div>`;
    }
    return `<form class="coupon" id="couponForm">
      <label class="sr-only" for="couponInput">Cupom de desconto</label>
      <input id="couponInput" placeholder="Cupom de desconto" autocomplete="off" autocapitalize="characters">
      <button class="btn btn--outline btn--sm">Aplicar</button></form>`;
  }

  function renderCart() {
    const t = ZP.pricing.compute();
    const n = ZP.store.count();
    $("#cartHeadCount").textContent = n ? `(${n} ${n === 1 ? "item" : "itens"})` : "";
    $("#freeShip").innerHTML = freeShippingBar(t);

    if (!t.lines.length) {
      $("#cartBody").innerHTML = `
        <div class="empty">
          <span class="empty__icon">🛁</span>
          <h3>Sua sacola está vazia</h3>
          <p>Que tal começar pelos queridinhos da casa?</p>
          <a class="btn btn--primary" href="#produtos" data-close>Explorar produtos</a>
        </div>${upsell()}`;
      $("#cartFoot").hidden = true;
      return;
    }

    $("#cartBody").innerHTML = `<ul class="cart-lines">${t.lines.map(lineHTML).join("")}</ul>${upsell()}`;
    $("#cartFoot").hidden = false;
    $("#cartFoot").innerHTML = `
      ${couponHTML(t)}
      <dl class="summary">
        <div><dt>Subtotal</dt><dd>${brl(t.subtotal)}</dd></div>
        ${t.savings > 0 ? `<div class="summary__save"><dt>Você economiza</dt><dd>${brl(t.savings)}</dd></div>` : ""}
        ${t.discount ? `<div class="summary__save"><dt>Cupom ${esc(t.coupon.code)}</dt><dd>− ${brl(t.discount)}</dd></div>` : ""}
        <div><dt>Frete</dt><dd>${t.freeShip ? "<b class='ok'>Grátis</b>" : "Calculado no checkout"}</dd></div>
        <div class="summary__total"><dt>Total</dt><dd>${brl(t.total)}</dd></div>
        <div class="summary__pix"><dt>${icon("pix")} No Pix (${cfg.payment.pixDiscount}% OFF)</dt><dd>${brl(ZP.pricing.pixPrice(t.total))}</dd></div>
      </dl>
      <button class="btn btn--primary btn--lg btn--block" id="goCheckout">Finalizar compra ${icon("arrow-right")}</button>
      <button class="link-btn link-btn--center" data-close>Continuar comprando</button>`;
  }

  /* ---------- Favoritos ---------- */
  function renderFavs() {
    const favs = ZP.store.state.favs.map(ZP.byId);
    $("#favBody").innerHTML = favs.length
      ? `<ul class="fav-list">${favs.map((p) => `
          <li class="cart-line">
            <button class="cart-line__img" data-open="${p.id}" style="--tint:${ZP.catById(p.cat).tint}" aria-label="Ver ${esc(p.name)}">${ZP.art.product(p)}</button>
            <div class="cart-line__info">
              <button class="cart-line__name" data-open="${p.id}">${esc(p.name)}</button>
              <small>${brl(p.variants[0].price)}</small>
              <div class="cart-line__actions">
                <button class="btn btn--primary btn--sm" data-quickadd="${p.id}">${icon("bag")} Adicionar</button>
                <button class="link-btn link-btn--danger" data-fav="${p.id}">${icon("trash")} Remover</button>
              </div>
            </div>
          </li>`).join("")}</ul>
        <button class="btn btn--outline btn--block" id="favAddAll">Adicionar todos à sacola</button>`
      : `<div class="empty">
          <span class="empty__icon">💜</span>
          <h3>Nenhum favorito ainda</h3>
          <p>Toque no coração dos produtos para guardá-los aqui.</p>
          <a class="btn btn--primary" href="#produtos" data-close>Ver produtos</a>
        </div>`;
  }

  /* ---------- Eventos ---------- */
  function bind() {
    $("#cartBtn").addEventListener("click", () => openLayer("#cartLayer"));
    $("#favBtn").addEventListener("click", () => openLayer("#favLayer"));

    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-line-qty],[data-line-remove],[data-coupon-remove],#goCheckout,#favAddAll");
      if (!t) return;
      if (t.dataset.lineQty) {
        const [id, v, d] = t.dataset.lineQty.split(":").map(Number);
        const line = ZP.store.state.cart.find((l) => l.id === id && l.v === v);
        if (line) ZP.store.setQty(id, v, line.qty + d);
      } else if (t.dataset.lineRemove) {
        const [id, v] = t.dataset.lineRemove.split(":").map(Number);
        ZP.store.remove(id, v);
      } else if ("couponRemove" in t.dataset) {
        ZP.store.setCoupon(null);
      } else if (t.id === "goCheckout") {
        ZP.checkout.open();
      } else if (t.id === "favAddAll") {
        ZP.store.state.favs.forEach((id) => ZP.store.add(id));
        toast("Favoritos adicionados à sacola!");
        closeLayer("#favLayer");
        openLayer("#cartLayer");
      }
    });

    document.addEventListener("submit", (e) => {
      if (e.target.id !== "couponForm") return;
      e.preventDefault();
      const code = $("#couponInput").value.trim().toUpperCase();
      if (!code) return;
      const r = ZP.pricing.checkCoupon(code, ZP.pricing.compute().subtotal);
      if (!cfg.coupons[code]) { toast(r.error, "error"); return; }
      ZP.store.setCoupon(code);
      toast(r.ok ? "Cupom aplicado! 🎉" : r.error, r.ok ? "ok" : "error");
    });

    ZP.store.subscribe(() => {
      renderCounts(); renderCart(); renderFavs();
      // Se o elemento focado sumiu na re-renderização, devolve o foco à gaveta aberta
      const top = ZP.u.topLayer();
      if (top && !top.contains(document.activeElement)) $(".layer__panel", top).focus({ preventScroll: true });
    });
  }

  ZP.cart = {
    init() { bind(); renderCounts(); renderCart(); renderFavs(); },
  };
})(window.ZP);
