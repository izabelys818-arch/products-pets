/* =========================================================================
   CHECKOUT — 4 etapas (dados → entrega → pagamento → revisão),
   CEP automático (ViaCEP), cálculo de frete e envio do pedido pelo WhatsApp
   ========================================================================= */
window.ZP = window.ZP || {};

(function (ZP) {
  const { $, $$, brl, esc, icon, onlyDigits, storage, toast, openLayer, closeLayer, waLink } = ZP.u;
  const cfg = ZP.config;

  const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
  const STEPS = ["Seus dados", "Entrega", "Pagamento", "Revisão"];
  const PAYMENTS = {
    pix:  { label: "Pix", desc: `${cfg.payment.pixDiscount}% de desconto · enviamos a chave Pix no WhatsApp`, icon: "pix" },
    card: { label: "Cartão de crédito", desc: `Até ${cfg.payment.maxInstallments}x sem juros · enviamos um link de pagamento seguro`, icon: "card" },
    cash: { label: "Dinheiro", desc: "Pague na entrega ou na retirada", icon: "money" },
  };

  // Dados do cliente ficam salvos só neste navegador, para agilizar a próxima compra
  const data = Object.assign({
    name: "", phone: "", email: "",
    mode: "delivery", cep: "", street: "", number: "", complement: "", district: "", city: "", uf: "",
    payment: "pix", change: "", notes: "",
  }, storage.get("customer", {}));

  let step = 0;
  let cepStatus = "";

  /* ---------- Máscaras ---------- */
  const maskPhone = (v) => {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  };
  const maskCep = (v) => { const d = onlyDigits(v).slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; };

  /* ---------- Frete ---------- */
  function quote() {
    if (data.mode === "pickup") return { price: 0, days: cfg.shipping.pickup.days, name: cfg.shipping.pickup.label };
    if (!UFS.includes(data.uf)) return null;
    return ZP.pricing.shippingFor(data.uf);
  }

  const totals = () => {
    const q = quote();
    return ZP.pricing.compute({ shipping: q ? q.price : null, payment: data.payment });
  };

  /* ---------- Componentes de formulário ---------- */
  const field = (name, label, { type = "text", req = false, ph = "", cls = "", attrs = "" } = {}) => `
    <div class="field ${cls}">
      <label for="co-${name}">${label}${req ? ' <span aria-hidden="true">*</span>' : ""}</label>
      <input id="co-${name}" name="${name}" type="${type}" value="${esc(data[name])}" placeholder="${ph}" ${req ? "required" : ""} ${attrs}>
      <small class="field__error" aria-live="polite"></small>
    </div>`;

  const option = (group, value, title, desc, iconName, checked) => `
    <label class="option ${checked ? "is-active" : ""}">
      <input type="radio" name="${group}" value="${value}" ${checked ? "checked" : ""}>
      <span class="option__icon">${icon(iconName)}</span>
      <span class="option__text"><b>${title}</b><small>${desc}</small></span>
      <span class="option__check">${icon("check")}</span>
    </label>`;

  /* ---------- Etapas ---------- */
  const views = [
    // 1. Dados
    () => `
      <h3 class="co__title">Como podemos falar com você?</h3>
      <div class="form-grid">
        ${field("name", "Nome completo", { req: true, ph: "Ex.: Maria Silva", cls: "span-2", attrs: 'autocomplete="name"' })}
        ${field("phone", "WhatsApp", { type: "tel", req: true, ph: "(11) 99999-9999", attrs: 'autocomplete="tel" inputmode="tel"' })}
        ${field("email", "E-mail (opcional)", { type: "email", ph: "voce@email.com", attrs: 'autocomplete="email"' })}
      </div>
      <p class="co__note">${icon("shield")} Seus dados ficam salvos apenas neste navegador para agilizar a próxima compra.</p>`,

    // 2. Entrega
    () => {
      const q = quote();
      return `
      <h3 class="co__title">Como você quer receber?</h3>
      <div class="options">
        ${option("mode", "delivery", "Receber em casa", "Entregamos no seu endereço", "truck", data.mode === "delivery")}
        ${cfg.shipping.pickup.enabled ? option("mode", "pickup", cfg.shipping.pickup.label, `Grátis · ${cfg.shipping.pickup.days}`, "store", data.mode === "pickup") : ""}
      </div>
      ${data.mode === "pickup" ? `
        <div class="pickup-card">${icon("pin")}<div><b>${esc(cfg.store.address)}</b><small>${esc(cfg.store.hours)}</small></div></div>` : `
        <div class="form-grid">
          ${field("cep", "CEP", { req: true, ph: "00000-000", attrs: 'inputmode="numeric" autocomplete="postal-code"' })}
          <div class="field field--hint"><a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noopener">Não sei meu CEP</a><small id="cepStatus" aria-live="polite">${cepStatus}</small></div>
          ${field("street", "Rua / Avenida", { req: true, cls: "span-2", attrs: 'autocomplete="address-line1"' })}
          ${field("number", "Número", { req: true, attrs: 'inputmode="numeric"' })}
          ${field("complement", "Complemento", { ph: "Apto, bloco..." })}
          ${field("district", "Bairro", { req: true })}
          ${field("city", "Cidade", { req: true, attrs: 'autocomplete="address-level2"' })}
          <div class="field">
            <label for="co-uf">Estado <span aria-hidden="true">*</span></label>
            <select id="co-uf" name="uf" required><option value="">Selecione</option>${UFS.map((u) => `<option ${u === data.uf ? "selected" : ""}>${u}</option>`).join("")}</select>
            <small class="field__error" aria-live="polite"></small>
          </div>
        </div>`}
      <div class="ship-quote" id="shipQuote">${shipQuoteHTML(q)}</div>`;
    },

    // 3. Pagamento
    () => `
      <h3 class="co__title">Como você prefere pagar?</h3>
      <div class="options">
        ${Object.entries(PAYMENTS).map(([k, p]) => option("payment", k, p.label, p.desc, p.icon, data.payment === k)).join("")}
      </div>
      ${data.payment === "cash" ? `<div class="form-grid">${field("change", "Troco para quanto? (opcional)", { ph: "Ex.: R$ 100", attrs: 'inputmode="decimal"' })}</div>` : ""}
      <div class="form-grid">
        <div class="field span-2">
          <label for="co-notes">Observações (opcional)</label>
          <textarea id="co-notes" name="notes" rows="3" placeholder="Ex.: entregar após as 14h, presente...">${esc(data.notes)}</textarea>
        </div>
      </div>
      <p class="co__note">${icon("chat")} O pagamento é combinado com segurança pelo WhatsApp, depois que confirmamos o pedido. Nenhum dado de cartão é digitado neste site.</p>`,

    // 4. Revisão
    () => {
      const t = totals();
      const q = quote();
      const addr = data.mode === "pickup" ? `${cfg.shipping.pickup.label} — ${cfg.store.address}` :
        `${data.street}, ${data.number}${data.complement ? ` (${data.complement})` : ""} — ${data.district}, ${data.city}/${data.uf} — CEP ${data.cep}`;
      return `
      <h3 class="co__title">Confira seu pedido</h3>
      <div class="review">
        <section><header><b>${icon("user")} Seus dados</b><button class="link-btn" data-go-step="0">Editar</button></header>
          <p>${esc(data.name)}<br>${esc(data.phone)}${data.email ? `<br>${esc(data.email)}` : ""}</p></section>
        <section><header><b>${icon("truck")} Entrega</b><button class="link-btn" data-go-step="1">Editar</button></header>
          <p>${esc(addr)}<br><small>${q ? esc(q.days) : ""}</small></p></section>
        <section><header><b>${icon(PAYMENTS[data.payment].icon)} Pagamento</b><button class="link-btn" data-go-step="2">Editar</button></header>
          <p>${PAYMENTS[data.payment].label}${data.payment === "card" ? ` · até ${ZP.pricing.installments(t.total).n}x de ${brl(ZP.pricing.installments(t.total).each)}` : ""}${data.payment === "cash" && data.change ? ` · troco para ${esc(data.change)}` : ""}</p></section>
        <section class="span-2"><header><b>${icon("bag")} Itens (${ZP.store.count()})</b></header>
          <ul class="review__items">${t.lines.map((l) => `<li><span>${l.qty}× ${esc(l.p.name)} <small>${l.variant.label}</small></span><b>${brl(l.total)}</b></li>`).join("")}</ul></section>
      </div>
      <label class="consent"><input type="checkbox" id="co-consent"> <span>Li e concordo com as <a href="politicas.html" target="_blank">políticas de troca, entrega e privacidade</a>.</span></label>
      <small class="field__error" id="consentError" aria-live="polite"></small>`;
    },
  ];

  function shipQuoteHTML(q) {
    if (!q) return `${icon("truck")} <span>Informe o CEP para calcular o frete.</span>`;
    const t = ZP.pricing.compute({ shipping: q.price });
    const price = data.mode === "pickup" || t.shipping === 0 ? "<b class='ok'>Grátis</b>" : `<b>${brl(t.shipping)}</b>`;
    return `${icon(data.mode === "pickup" ? "store" : "truck")} <span>${esc(q.name)}: ${price} · ${esc(q.days)}</span>`;
  }

  function summaryHTML() {
    const t = totals();
    return `
      <h4>Resumo</h4>
      <ul class="co-sum__items">${t.lines.map((l) => `
        <li><span class="co-sum__img" style="--tint:${ZP.catById(l.p.cat).tint}">${ZP.art.product(l.p)}<i>${l.qty}</i></span>
        <span class="co-sum__name">${esc(l.p.name)}<small>${l.variant.label}</small></span><b>${brl(l.total)}</b></li>`).join("")}</ul>
      <dl class="summary">
        <div><dt>Subtotal</dt><dd>${brl(t.subtotal)}</dd></div>
        ${t.discount ? `<div class="summary__save"><dt>Cupom ${esc(t.coupon.code)}</dt><dd>− ${brl(t.discount)}</dd></div>` : ""}
        ${t.pix ? `<div class="summary__save"><dt>Desconto Pix</dt><dd>− ${brl(t.pix)}</dd></div>` : ""}
        <div><dt>Frete</dt><dd>${t.shipping == null ? "—" : t.shipping === 0 ? "<b class='ok'>Grátis</b>" : brl(t.shipping)}</dd></div>
        <div class="summary__total"><dt>Total</dt><dd>${brl(t.total)}</dd></div>
      </dl>`;
  }

  function render() {
    $("#checkoutContent").innerHTML = `
      <ol class="co-steps" aria-label="Etapas do checkout">
        ${STEPS.map((s, i) => `<li class="${i < step ? "is-done" : ""} ${i === step ? "is-current" : ""}" ${i === step ? 'aria-current="step"' : ""}>
          <span>${i < step ? icon("check") : i + 1}</span><b>${s}</b></li>`).join("")}
      </ol>
      <div class="co">
        <form class="co__form" id="coForm" novalidate>
          ${views[step]()}
          <div class="co__nav">
            ${step > 0 ? `<button type="button" class="btn btn--ghost" data-co-back>${icon("arrow-left")} Voltar</button>` : `<button type="button" class="btn btn--ghost" data-close>Voltar à sacola</button>`}
            <button class="btn btn--primary btn--lg">${step < STEPS.length - 1 ? `Continuar ${icon("arrow-right")}` : `${icon("whatsapp")} Enviar pedido pelo WhatsApp`}</button>
          </div>
        </form>
        <aside class="co-sum" id="coSummary">${summaryHTML()}</aside>
      </div>`;
    const first = $("#coForm input:not([type=radio]):not([type=checkbox]), #coForm select");
    if (first && !first.value) setTimeout(() => first.focus(), 80);
  }

  /* ---------- Validação ---------- */
  function setError(name, msg) {
    const input = $(`#co-${name}`);
    const f = input && input.closest(".field");
    const out = f && $(".field__error", f);
    if (!out) return;
    f.classList.toggle("is-error", !!msg);
    out.textContent = msg || "";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
  }

  function validate() {
    const errors = {};
    if (step === 0) {
      if (data.name.trim().split(/\s+/).length < 2) errors.name = "Informe nome e sobrenome.";
      if (onlyDigits(data.phone).length < 10) errors.phone = "WhatsApp inválido. Use DDD + número.";
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "E-mail inválido.";
    }
    if (step === 1 && data.mode === "delivery") {
      if (onlyDigits(data.cep).length !== 8) errors.cep = "CEP deve ter 8 dígitos.";
      ["street", "number", "district", "city"].forEach((k) => { if (!data[k].trim()) errors[k] = "Campo obrigatório."; });
      if (!UFS.includes(data.uf)) errors.uf = "Selecione o estado.";
    }
    Object.keys(data).forEach((k) => setError(k, errors[k]));
    if (step === 3 && !$("#co-consent").checked) {
      $("#consentError").textContent = "Confirme que leu as políticas para enviar o pedido.";
      return false;
    }
    const firstError = Object.keys(errors)[0];
    if (firstError) $(`#co-${firstError}`).focus();
    return !firstError;
  }

  /* ---------- CEP ---------- */
  async function lookupCep() {
    const cep = onlyDigits(data.cep);
    if (cep.length !== 8) return;
    const status = (msg) => { cepStatus = msg; const el = $("#cepStatus"); if (el) el.textContent = msg; };
    status("Buscando endereço...");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const r = await res.json();
      if (r.erro) throw new Error();
      Object.assign(data, { street: r.logradouro || data.street, district: r.bairro || data.district, city: r.localidade, uf: r.uf });
      cepStatus = "Endereço encontrado ✓";
      render();
      $(data.street ? "#co-number" : "#co-street").focus();
    } catch {
      status("Não encontramos o CEP. Preencha o endereço manualmente.");
    }
  }

  /* ---------- Pedido ---------- */
  function orderMessage(id) {
    const t = totals();
    const q = quote();
    const lines = t.lines.map((l) => `• ${l.qty}x ${l.p.name} (${l.variant.label}) — ${brl(l.total)}`).join("\n");
    const ship = data.mode === "pickup" ? "Retirada na loja (grátis)" : t.shipping === 0 ? `Grátis (${q.days})` : `${brl(t.shipping)} (${q.days})`;
    const pay = PAYMENTS[data.payment].label +
      (data.payment === "card" ? ` — até ${ZP.pricing.installments(t.total).n}x sem juros (enviar link)` : "") +
      (data.payment === "cash" && data.change ? ` — troco para ${data.change}` : "");
    const address = data.mode === "pickup" ? "Retirada na loja" :
      `${data.street}, ${data.number}${data.complement ? ` - ${data.complement}` : ""}\n${data.district} — ${data.city}/${data.uf}\nCEP ${data.cep}`;

    return [
      `*Novo pedido — ${cfg.store.name}* 🐾`,
      `Pedido: *${id}*`,
      "",
      "*Itens*",
      lines,
      "",
      `Subtotal: ${brl(t.subtotal)}`,
      t.discount ? `Cupom ${t.coupon.code}: −${brl(t.discount)}` : null,
      t.pix ? `Desconto Pix: −${brl(t.pix)}` : null,
      `Frete: ${ship}`,
      `*Total: ${brl(t.total)}*`,
      "",
      `*Pagamento:* ${pay}`,
      "",
      "*Cliente*",
      data.name,
      data.phone,
      data.email || null,
      "",
      "*Entrega*",
      address,
      data.notes ? `\n*Observações:* ${data.notes}` : null,
    ].filter((x) => x !== null).join("\n");
  }

  function submitOrder() {
    const id = "ZP-" + Date.now().toString(36).slice(-6).toUpperCase();
    const total = totals().total;
    window.open(waLink(orderMessage(id)), "_blank", "noopener");
    ZP.store.clear();
    $("#checkoutContent").innerHTML = `
      <div class="co-done">
        <span class="co-done__icon">🎉</span>
        <h2>Pedido enviado!</h2>
        <p>Seu pedido <b>${id}</b> no valor de <b>${brl(total)}</b> foi enviado para o nosso WhatsApp.<br>
        Agora é só aguardar a confirmação e as instruções de pagamento.</p>
        <p class="co__note">${icon("chat")} O WhatsApp não abriu? <a href="${waLink(`Olá! Acabei de fazer o pedido ${id} pelo site.`)}" target="_blank" rel="noopener">Clique aqui para falar com a gente</a>.</p>
        <button class="btn btn--primary" data-close>Voltar para a loja</button>
      </div>`;
  }

  /* ---------- Eventos ---------- */
  function bind() {
    const root = $("#checkoutContent");

    root.addEventListener("input", (e) => {
      const el = e.target;
      if (!el.name || el.type === "radio" || el.type === "checkbox") return;
      if (el.name === "phone") el.value = maskPhone(el.value);
      if (el.name === "cep") el.value = maskCep(el.value);
      data[el.name] = el.value;
      if (el.closest(".field")?.classList.contains("is-error")) setError(el.name, "");
      if (el.name === "cep" && onlyDigits(el.value).length === 8) lookupCep();
      if (el.name === "uf") { $("#shipQuote").innerHTML = shipQuoteHTML(quote()); $("#coSummary").innerHTML = summaryHTML(); }
    });

    root.addEventListener("change", (e) => {
      const el = e.target;
      if (el.type === "radio") { data[el.name] = el.value; render(); }
      if (el.id === "co-consent") $("#consentError").textContent = "";
    });

    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-co-back]")) { step--; render(); }
      const go = e.target.closest("[data-go-step]");
      if (go) { step = +go.dataset.goStep; render(); }
    });

    root.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) return;
      storage.set("customer", { ...data, notes: "" });
      if (step < STEPS.length - 1) { step++; render(); $(".layer__panel", $("#checkoutLayer")).scrollTop = 0; }
      else submitOrder();
    });
  }

  ZP.checkout = {
    init: bind,
    open() {
      if (!ZP.store.state.cart.length) { toast("Sua sacola está vazia.", "error"); return; }
      step = 0;
      render();
      closeLayer("#cartLayer");
      openLayer("#checkoutLayer");
    },
  };
})(window.ZP);
