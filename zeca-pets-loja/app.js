// ====== CONFIGURAÇÃO DA LOJA ======
const WHATSAPP = "5511999999999"; // troque pelo número da loja (DDI+DDD+número)
const FREE_SHIPPING_FROM = 150;
const SHIPPING_FEE = 19.9;
const COUPONS = { BEMVINDO10: 0.10 };

// ====== PRODUTOS (exemplos — edite nomes, preços e pets) ======
const PETS = { "Cães": "🐶", "Gatos": "🐱", "Coelhos": "🐰", "Cavalos": "🐴" };
const ICON = { "Shampoo": "🧴", "Condicionador": "🧴", "Leave-in": "💧", "Perfumes e colônias": "🌸", "Higiene e cuidados": "🧼" };

const PRODUCTS = [
  { id: 1,  name: "Shampoo Limpeza Profunda 500ml",     cat: "Shampoo",             pets: ["Cães", "Gatos"],            desc: "Limpeza profunda e pelagem saudável.",  price: 34.9, old: 42.9, rating: 5, tag: "Mais vendido" },
  { id: 2,  name: "Shampoo Neutro Hipoalergênico 500ml", cat: "Shampoo",            pets: ["Cães", "Gatos", "Coelhos"], desc: "Suave para peles sensíveis.",           price: 29.9, rating: 5 },
  { id: 3,  name: "Shampoo Equinos 1L",                 cat: "Shampoo",             pets: ["Cavalos"],                  desc: "Limpa e dá brilho à pelagem.",          price: 79.9, rating: 4 },
  { id: 4,  name: "Condicionador Maciez 500ml",         cat: "Condicionador",       pets: ["Cães", "Gatos"],            desc: "Maciez, hidratação e desembaraço.",     price: 32.9, rating: 5, tag: "Novo" },
  { id: 5,  name: "Condicionador Pelos Longos 500ml",   cat: "Condicionador",       pets: ["Cães", "Gatos"],            desc: "Desembaraça sem puxar.",                price: 36.9, old: 44.9, rating: 4, tag: "Promo" },
  { id: 6,  name: "Leave-in Proteção e Brilho 240ml",   cat: "Leave-in",            pets: ["Cães", "Gatos"],            desc: "Proteção, brilho e perfumação.",        price: 27.9, rating: 5 },
  { id: 7,  name: "Leave-in Crina e Cauda 500ml",       cat: "Leave-in",            pets: ["Cavalos"],                  desc: "Desembaraça e protege crina e cauda.",  price: 59.9, rating: 5 },
  { id: 8,  name: "Colônia Cheirinho de Bebê 120ml",    cat: "Perfumes e colônias", pets: ["Cães", "Gatos"],            desc: "Aquele cheirinho delicioso por mais tempo.", price: 24.9, rating: 5, tag: "Promo", old: 29.9 },
  { id: 9,  name: "Perfume Pet Floral 100ml",           cat: "Perfumes e colônias", pets: ["Cães"],                     desc: "Fragrância floral duradoura.",          price: 39.9, rating: 4 },
  { id: 10, name: "Lenço Umedecido Pet 50un",           cat: "Higiene e cuidados",  pets: ["Cães", "Gatos", "Coelhos"], desc: "Limpeza rápida entre os banhos.",       price: 19.9, rating: 4 },
  { id: 11, name: "Escova Removedora de Pelos",         cat: "Higiene e cuidados",  pets: ["Cães", "Gatos", "Coelhos"], desc: "Remove pelos e massageia.",             price: 22.9, rating: 5 },
  { id: 12, name: "Kit Banho: Shampoo + Condicionador + Colônia", cat: "Higiene e cuidados", pets: ["Cães", "Gatos"], desc: "O combo completo do banho.",          price: 84.9, old: 99.9, rating: 5, tag: "Kit" },
];

// ====== ESTADO ======
const $ = (s) => document.querySelector(s);
const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
let cart = [], state = { cat: "Todos", pet: "", q: "", sort: "rel", coupon: null };
try { cart = JSON.parse(localStorage.getItem("cart")) || []; } catch {}
const save = () => { try { localStorage.setItem("cart", JSON.stringify(cart)); } catch {} };
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ====== CATÁLOGO ======
function renderChips() {
  const cats = ["Todos", ...new Set(PRODUCTS.map((p) => p.cat))];
  $("#chips").innerHTML = cats.map((c) => `<button class="chip ${c === state.cat ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");
}

function renderGrid() {
  const q = state.q.toLowerCase();
  const list = PRODUCTS.filter((p) =>
    (state.cat === "Todos" || p.cat === state.cat) &&
    (!state.pet || p.pets.includes(state.pet)) &&
    (p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)));
  if (state.sort === "asc") list.sort((a, b) => a.price - b.price);
  if (state.sort === "desc") list.sort((a, b) => b.price - a.price);

  $("#empty").hidden = list.length > 0;
  $("#grid").innerHTML = list.map((p) => `
    <article class="card">
      <div class="thumb">${p.tag ? `<span class="badge">${p.tag}</span>` : ""}<span class="bottle">${ICON[p.cat]}</span><span class="pets">${p.pets.map((x) => PETS[x]).join("")}</span></div>
      <div class="info">
        <small>${p.cat}</small>
        <h3>${esc(p.name)}</h3>
        <p class="desc">${esc(p.desc)}</p>
        <div class="stars" aria-label="${p.rating} de 5">${"★".repeat(p.rating)}${"☆".repeat(5 - p.rating)}</div>
        <div class="price"><b>${brl(p.price)}</b>${p.old ? `<s>${brl(p.old)}</s>` : ""}</div>
        <div class="parc">ou 3x de ${brl(p.price / 3)}</div>
        <button class="add" data-add="${p.id}">Adicionar ao carrinho</button>
      </div>
    </article>`).join("");
}

// ====== CARRINHO ======
function totals() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = state.coupon ? subtotal * COUPONS[state.coupon] : 0;
  const shipping = cart.length === 0 ? 0 : (subtotal - discount >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE);
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}

function renderCart() {
  $("#cartCount").textContent = cart.reduce((s, i) => s + i.qty, 0);
  $("#cartItems").innerHTML = cart.length ? cart.map((i) => `
    <div class="item">
      <div class="em">${ICON[i.cat]}</div>
      <div>
        <b>${esc(i.name)}</b><br><small>${brl(i.price)}</small>
        <div class="qty">
          <button data-dec="${i.id}" aria-label="Diminuir">−</button><span>${i.qty}</span>
          <button data-inc="${i.id}" aria-label="Aumentar">+</button>
          <button class="rm" data-rm="${i.id}">remover</button>
        </div>
      </div>
      <b>${brl(i.price * i.qty)}</b>
    </div>`).join("") : `<p class="none">Seu carrinho está vazio 🐾</p>`;

  const t = totals();
  $("#subtotal").textContent = brl(t.subtotal);
  $("#discount").textContent = "− " + brl(t.discount);
  $("#shipping").textContent = cart.length ? (t.shipping ? brl(t.shipping) : "Grátis") : "—";
  $("#total").textContent = brl(t.total);
  $("#checkout").disabled = !cart.length;
  save();
}

function addToCart(id) {
  const p = PRODUCTS.find((x) => x.id === id);
  const line = cart.find((i) => i.id === id);
  line ? line.qty++ : cart.push({ ...p, qty: 1 });
  renderCart();
  toast(`${p.name} adicionado ✔`);
}

function changeQty(id, d) {
  const line = cart.find((i) => i.id === id);
  if (!line) return;
  line.qty += d;
  if (line.qty <= 0) cart = cart.filter((i) => i.id !== id);
  renderCart();
}

function openCart(open) {
  $("#drawer").classList.toggle("open", open);
  $("#drawer").setAttribute("aria-hidden", String(!open));
  $("#overlay").hidden = !open;
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 1800);
}

function checkout() {
  const t = totals();
  const name = $("#custName").value.trim() || "cliente";
  const lines = cart.map((i) => `• ${i.qty}x ${i.name} — ${brl(i.price * i.qty)}`).join("\n");
  const msg = `Olá, Zeca Pets! Sou ${name} e gostaria de fazer este pedido:\n\n${lines}\n\nSubtotal: ${brl(t.subtotal)}` +
    (t.discount ? `\nDesconto (${state.coupon}): −${brl(t.discount)}` : "") +
    `\nFrete: ${t.shipping ? brl(t.shipping) : "Grátis"}\n*Total: ${brl(t.total)}*`;
  window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
}

// ====== EVENTOS ======
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-add],[data-inc],[data-dec],[data-rm],[data-cat]");
  if (!el) return;
  const d = el.dataset;
  if (d.add) addToCart(+d.add);
  if (d.inc) changeQty(+d.inc, 1);
  if (d.dec) changeQty(+d.dec, -1);
  if (d.rm) { cart = cart.filter((i) => i.id !== +d.rm); renderCart(); }
  if (d.cat) {
    state.cat = d.cat; renderChips(); renderGrid();
    if (el.closest(".cats")) $("#produtos").scrollIntoView({ behavior: "smooth" });
  }
});
$("#openCart").onclick = () => openCart(true);
$("#closeCart").onclick = $("#overlay").onclick = () => openCart(false);
document.addEventListener("keydown", (e) => e.key === "Escape" && openCart(false));
$("#search").oninput = (e) => { state.q = e.target.value; renderGrid(); };
$("#searchForm").onsubmit = (e) => { e.preventDefault(); $("#produtos").scrollIntoView({ behavior: "smooth" }); };
$("#sort").onchange = (e) => { state.sort = e.target.value; renderGrid(); };
$("#pet").onchange = (e) => { state.pet = e.target.value; renderGrid(); };
$("#applyCoupon").onclick = () => {
  const code = $("#coupon").value.trim().toUpperCase();
  if (COUPONS[code]) { state.coupon = code; toast("Cupom aplicado 🎉"); }
  else { state.coupon = null; toast("Cupom inválido"); }
  renderCart();
};
$("#checkout").onclick = checkout;
$("#newsForm").onsubmit = (e) => { e.preventDefault(); e.target.hidden = true; $("#newsMsg").hidden = false; };
$("#year").textContent = new Date().getFullYear();

renderChips(); renderGrid(); renderCart();
