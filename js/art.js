/* =========================================================================
   ILUSTRAÇÕES — desenha automaticamente o frasco de cada produto em SVG,
   com as cores e o rótulo da Zeca Pets. Se o produto tiver `img`, a foto
   real é usada no lugar.
   ========================================================================= */
window.ZP = window.ZP || {};

(function (ZP) {
  const PURPLE = "#2e0b5c";
  const DEFAULT_SHAPE = { shampoo: "pump", condicionador: "pump", "leave-in": "spray", perfumes: "perfume", higiene: "tube", kits: "kit" };
  const FONT = "font-family:'Baloo 2',Nunito,sans-serif";
  const fit = (text, width, max) => Math.min(max, (width - 8) / (Math.max(text.length, 1) * 0.56));

  // Rótulo branco com patinha, marca, nome e linha de apoio
  function label(x, y, w, h, l1, l2, accent) {
    const cx = x + w / 2;
    return `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#fff"/>
      <use href="#i-paw" x="${cx - 6}" y="${y + 6}" width="12" height="12" fill="${accent}"/>
      <text x="${cx}" y="${y + 28}" text-anchor="middle" style="${FONT};font-weight:800;font-size:7.5px;letter-spacing:.8px" fill="${PURPLE}">ZECA PETS</text>
      <text x="${cx}" y="${y + 43}" text-anchor="middle" style="${FONT};font-weight:800;font-size:${fit(l1, w, 12.5)}px" fill="${PURPLE}">${l1}</text>
      ${l2 ? `<text x="${cx}" y="${y + 55}" text-anchor="middle" style="${FONT};font-weight:600;font-size:${fit(l2, w, 8)}px" fill="#7a6a92">${l2}</text>` : ""}`;
  }

  const shine = (x, y, h) => `<rect x="${x}" y="${y}" width="8" height="${h}" rx="4" fill="#fff" opacity=".28"/>`;
  const outline = (body) => (body.toLowerCase() === "#ffffff" ? ` stroke="#e3d8f3" stroke-width="2"` : "");

  const shapes = {
    pump: ({ body, cap, l1, l2 }) => `
      <path d="M100 20h24a5 5 0 0 1 5 5v6h-29z" fill="${cap}"/>
      <rect x="92" y="20" width="16" height="26" rx="3" fill="${cap}"/>
      <rect x="80" y="42" width="40" height="17" rx="5" fill="${cap}"/>
      <rect x="58" y="56" width="84" height="128" rx="22" fill="${body}"${outline(body)}/>
      ${shine(66, 68, 100)}${label(68, 94, 64, 64, l1, l2, cap)}`,

    spray: ({ body, cap, l1, l2 }) => `
      <path d="M82 26h34l16 9v9h-12l-6-4H82z" fill="${cap}"/>
      <path d="M113 40l7 20" stroke="${cap}" stroke-width="6" stroke-linecap="round"/>
      <path d="M90 44h20l4 16H86z" fill="${cap}"/>
      <rect x="62" y="58" width="76" height="126" rx="18" fill="${body}"${outline(body)}/>
      ${shine(70, 70, 98)}${label(70, 96, 60, 64, l1, l2, cap)}`,

    perfume: ({ body, cap, l1, l2 }) => `
      <rect x="88" y="26" width="24" height="20" rx="5" fill="${cap}"/>
      <rect x="84" y="44" width="32" height="14" rx="4" fill="${cap}" opacity=".85"/>
      <rect x="50" y="56" width="100" height="128" rx="40" fill="${body}"${outline(body)}/>
      ${shine(62, 76, 84)}${label(68, 92, 64, 64, l1, l2, cap)}`,

    tube: ({ body, cap, l1, l2 }) => `
      <rect x="78" y="30" width="44" height="28" rx="10" fill="${cap}"/>
      <rect x="86" y="24" width="28" height="10" rx="4" fill="${cap}"/>
      <path d="M64 56h72a6 6 0 0 1 6 6l-4 116a6 6 0 0 1-6 6H68a6 6 0 0 1-6-6l-4-116a6 6 0 0 1 6-6z" fill="${body}"${outline(body)}/>
      ${shine(70, 68, 100)}${label(68, 92, 64, 64, l1, l2, cap)}`,

    box: ({ body, cap, l1, l2 }) => `
      <rect x="30" y="72" width="140" height="108" rx="18" fill="${body}"/>
      <ellipse cx="100" cy="72" rx="34" ry="9" fill="${cap}"/>
      <path d="M84 72c4-22 28-22 32 0" fill="#fff" stroke="#e3d8f3" stroke-width="2"/>
      ${shine(40, 84, 84)}${label(62, 98, 76, 64, l1, l2, cap)}`,

    brush: ({ body, cap }) => `
      <rect x="40" y="58" width="120" height="58" rx="26" fill="${body}"/>
      ${Array.from({ length: 7 }, (_, i) => `<circle cx="${62 + i * 13}" cy="78" r="4" fill="${cap}"/><circle cx="${62 + i * 13}" cy="96" r="4" fill="${cap}"/>`).join("")}
      <rect x="88" y="112" width="24" height="70" rx="12" fill="${cap}"/>
      <use href="#i-paw" x="92" y="140" width="16" height="16" fill="#fff"/>`,

    kit: ({ colors = ["#6a1fc2", "#b6e61e", "#ff8fc0"], l1 }) => {
      const mini = (tx, ty, s, body, cap) => `
        <g transform="translate(${tx} ${ty}) scale(${s})">
          <rect x="92" y="22" width="16" height="22" rx="3" fill="${cap}"/>
          <rect x="80" y="40" width="40" height="17" rx="5" fill="${cap}"/>
          <rect x="58" y="54" width="84" height="128" rx="22" fill="${body}"${outline(body)}/>
          ${shine(66, 66, 100)}
          <rect x="70" y="96" width="60" height="44" rx="10" fill="#fff"/>
          <use href="#i-paw" x="88" y="104" width="24" height="24" fill="${cap}"/>
        </g>`;
      return `
        ${mini(-30, 46, 0.62, colors[0], "#b6e61e")}
        ${mini(98, 46, 0.62, colors[2], "#5b1fa8")}
        ${mini(34, 18, 0.74, colors[1], "#5b1fa8")}
        <rect x="44" y="150" width="112" height="30" rx="15" fill="#5b1fa8"/>
        <text x="100" y="170" text-anchor="middle" style="${FONT};font-weight:800;font-size:${fit("KIT " + l1.toUpperCase(), 112, 11)}px" fill="#fff">KIT ${l1.toUpperCase()}</text>`;
    },
  };

  ZP.art = {
    product(p, { cls = "" } = {}) {
      if (p.img) return `<img class="product-img ${cls}" src="${p.img}" alt="" loading="lazy">`;
      const a = p.art || {};
      const cat = ZP.catById(p.cat);
      const shape = a.shape || DEFAULT_SHAPE[p.cat] || "pump";
      const draw = shapes[shape] || shapes.pump;
      const body = draw({
        body: a.body || "#6a1fc2",
        cap: a.cap || "#b6e61e",
        colors: a.colors,
        l1: ZP.u.esc(a.label || cat.name.split(" ")[0]),
        l2: ZP.u.esc(a.sub || ""),
      });
      return `<svg class="product-art ${cls}" viewBox="0 0 200 200" role="img" aria-label="${ZP.u.esc(p.name)}">
        <ellipse cx="100" cy="188" rx="58" ry="7" fill="#2e0b5c" opacity=".08"/>${body}</svg>`;
    },
  };
})(window.ZP);
