/* =========================================================================
   ZECA PETS — CONFIGURAÇÃO DA LOJA
   Tudo o que muda de uma loja para outra fica aqui. Edite à vontade.
   ========================================================================= */
window.ZP = window.ZP || {};

ZP.config = {
  store: {
    name: "Zeca Pets",
    slogan: "Banho é cuidado, é bem-estar!",
    tagline: "Tudo o que seu pet precisa, em um só lugar!",
    // ⚠️ Troque pelos dados reais antes de publicar
    whatsapp: "5511999999999",           // DDI + DDD + número, só dígitos
    phone: "(11) 99999-9999",
    email: "contato@zecapets.com.br",
    instagram: "zecapets",               // sem @
    address: "Rua Exemplo, 123 — Centro, São Paulo/SP",
    hours: "Seg a Sex 9h às 18h · Sáb 9h às 13h",
    cnpj: "00.000.000/0001-00",
  },

  shipping: {
    freeFrom: 150,                       // frete grátis a partir deste valor (após cupom)
    zones: [
      { name: "São Paulo", ufs: ["SP"], price: 12.9, days: "1 a 3 dias úteis" },
      { name: "Sudeste e Sul", ufs: ["RJ", "MG", "ES", "PR", "SC", "RS"], price: 19.9, days: "3 a 6 dias úteis" },
    ],
    fallback: { name: "Demais regiões", price: 29.9, days: "5 a 10 dias úteis" },
    pickup: { enabled: true, label: "Retirar na loja", days: "Pronto em até 2 horas" },
  },

  payment: {
    pixDiscount: 5,                      // % de desconto no Pix
    maxInstallments: 3,                  // parcelas sem juros
    minInstallment: 30,                  // valor mínimo de cada parcela
  },

  // type: "percent" (value = %) ou "shipping" (frete grátis). min = pedido mínimo.
  coupons: {
    BEMVINDO10: { type: "percent", value: 10, label: "10% OFF na primeira compra" },
    ZECA20: { type: "percent", value: 20, min: 250, label: "20% OFF acima de R$ 250" },
    FRETEGRATIS: { type: "shipping", min: 80, label: "Frete grátis acima de R$ 80" },
  },

  announcements: [
    "🚚 Frete grátis em compras acima de R$ 150",
    "💜 10% OFF na primeira compra com o cupom BEMVINDO10",
    "⚡ 5% de desconto pagando no Pix",
    "💳 Parcele em até 3x sem juros",
  ],

  pageSize: 8,                           // produtos exibidos antes do "Carregar mais"
};
