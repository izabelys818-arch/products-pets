/* =========================================================================
   ESTADO — sacola, favoritos e cupom (persistidos no navegador)
   + PREÇOS — subtotal, cupom, frete, Pix e parcelamento
   ========================================================================= */
window.ZP = window.ZP || {};

(function (ZP) {
  const { storage } = ZP.u;
  const cfg = ZP.config;
  const listeners = [];

  const validLine = (l) => ZP.byId(l.id) && ZP.byId(l.id).variants[l.v] && l.qty > 0;

  const state = {
    cart: storage.get("cart", []).filter(validLine),
    favs: storage.get("favs", []).filter((id) => ZP.byId(id)),
    coupon: storage.get("coupon", null),
  };
  if (state.coupon && !cfg.coupons[state.coupon]) state.coupon = null;

  function emit(change) {
    storage.set("cart", state.cart);
    storage.set("favs", state.favs);
    storage.set("coupon", state.coupon);
    listeners.forEach((fn) => fn(change));
  }

  const findLine = (id, v) => state.cart.find((l) => l.id === id && l.v === v);

  ZP.store = {
    state,
    subscribe: (fn) => listeners.push(fn),

    add(id, v = 0, qty = 1) {
      const line = findLine(id, v);
      if (line) line.qty = Math.min(99, line.qty + qty);
      else state.cart.push({ id, v, qty });
      emit({ type: "cart", action: "add", id });
    },
    setQty(id, v, qty) {
      const line = findLine(id, v);
      if (!line) return;
      if (qty <= 0) state.cart = state.cart.filter((l) => l !== line);
      else line.qty = Math.min(99, qty);
      emit({ type: "cart" });
    },
    remove(id, v) {
      state.cart = state.cart.filter((l) => !(l.id === id && l.v === v));
      emit({ type: "cart" });
    },
    clear() {
      state.cart = [];
      state.coupon = null;
      emit({ type: "cart" });
    },
    count: () => state.cart.reduce((s, l) => s + l.qty, 0),

    isFav: (id) => state.favs.includes(id),
    toggleFav(id) {
      const on = !state.favs.includes(id);
      state.favs = on ? [...state.favs, id] : state.favs.filter((x) => x !== id);
      emit({ type: "favs", id, on });
      return on;
    },

    setCoupon(code) {
      state.coupon = code;
      emit({ type: "cart" });
    },
  };

  /* ---------- Preços ---------- */
  ZP.pricing = {
    lines() {
      return state.cart.map((l) => {
        const p = ZP.byId(l.id);
        const variant = p.variants[l.v];
        return { ...l, p, variant, total: variant.price * l.qty };
      });
    },

    // Avalia um cupom contra um subtotal. Retorna { ok, coupon?, error? }
    checkCoupon(code, subtotal) {
      const c = cfg.coupons[code];
      if (!c) return { ok: false, error: "Cupom inválido ou expirado." };
      if (c.min && subtotal < c.min) return { ok: false, error: `Este cupom vale para compras a partir de ${ZP.u.brl(c.min)}.` };
      return { ok: true, coupon: c };
    },

    shippingFor(uf) {
      const zone = cfg.shipping.zones.find((z) => z.ufs.includes(uf)) || cfg.shipping.fallback;
      return { price: zone.price, days: zone.days, name: zone.name };
    },

    // shipping: null = ainda não calculado; payment: "pix" | "card" | "cash" | null
    compute({ shipping = null, payment = null } = {}) {
      const lines = this.lines();
      const subtotal = lines.reduce((s, l) => s + l.total, 0);
      const oldTotal = lines.reduce((s, l) => s + (l.variant.old || l.variant.price) * l.qty, 0);

      let discount = 0, couponInfo = null, couponError = null, couponFreeShip = false;
      if (state.coupon) {
        const r = this.checkCoupon(state.coupon, subtotal);
        if (r.ok) {
          couponInfo = { code: state.coupon, ...r.coupon };
          if (r.coupon.type === "percent") discount = subtotal * r.coupon.value / 100;
          if (r.coupon.type === "shipping") couponFreeShip = true;
        } else couponError = r.error;
      }

      const afterDiscount = subtotal - discount;
      const freeShip = couponFreeShip || afterDiscount >= cfg.shipping.freeFrom;
      const ship = shipping == null ? null : (freeShip ? 0 : shipping);
      const pix = payment === "pix" ? afterDiscount * cfg.payment.pixDiscount / 100 : 0;
      const total = afterDiscount - pix + (ship || 0);

      return {
        lines, subtotal, savings: oldTotal - subtotal, discount, coupon: couponInfo, couponError,
        freeShip, shipping: ship, pix, total,
        missingForFree: Math.max(0, cfg.shipping.freeFrom - afterDiscount),
        freeProgress: Math.min(1, afterDiscount / cfg.shipping.freeFrom),
      };
    },

    installments(value) {
      const { maxInstallments, minInstallment } = cfg.payment;
      const n = Math.max(1, Math.min(maxInstallments, Math.floor(value / minInstallment)));
      return { n, each: value / n };
    },

    pixPrice: (value) => value * (1 - cfg.payment.pixDiscount / 100),
  };
})(window.ZP);
