# 🐾 Zeca Pets — Loja online

> **Banho é cuidado, é bem-estar!** Loja de produtos de banho e cuidado para cães, gatos, coelhos e cavalos.

Site em **HTML, CSS e JavaScript puros**, sem instalação e sem dependências. Os pedidos chegam prontos no **WhatsApp** da loja.

## ▶️ Como abrir

Dê dois cliques em `index.html`. Para testar como se estivesse publicado:

```bash
python -m http.server 8000
```

Depois acesse http://localhost:8000.

## ✨ Funcionalidades

| Área | O que tem |
|---|---|
| **Vitrine** | Hero com o catálogo, 6 categorias, filtro por pet, kits com desconto |
| **Catálogo** | Busca com sugestões em tempo real, filtros (categoria, pet, preço, ofertas), 6 ordenações, "carregar mais" |
| **Produto** | Página de detalhe com tamanhos, quantidade, benefícios, modo de uso, produtos relacionados e link compartilhável (`#p/nome-do-produto`) |
| **Favoritos** | Coração nos produtos e gaveta de favoritos |
| **Sacola** | Barra de frete grátis, cupons, economia, preço no Pix e sugestões de compra |
| **Checkout** | 4 etapas: dados, entrega (CEP automático via ViaCEP ou retirada), pagamento (Pix, cartão ou dinheiro) e revisão. O pedido sai formatado para o WhatsApp |
| **Conteúdo** | Como comprar, depoimentos, dicas de banho (blog), FAQ, contato e newsletter |
| **Extras** | Página de políticas (entregas, trocas, pagamentos, LGPD), aviso de cookies, botão flutuante do WhatsApp, SEO e acessibilidade |

## 🗂️ Estrutura

```
zeca-pets-loja/
├── index.html          # página principal
├── politicas.html      # entregas, trocas, pagamentos e privacidade
├── css/styles.css      # estilos organizados por seção
├── js/
│   ├── config.js       # ⚙️ dados da loja, frete, cupons e pagamento
│   ├── data.js         # 📦 produtos, categorias, dicas e depoimentos
│   ├── utils.js        # helpers (formatação, modais, toast)
│   ├── store.js        # sacola, favoritos e cálculo de preços
│   ├── art.js          # ilustração automática dos frascos (SVG)
│   ├── catalog.js      # vitrine, filtros, busca e detalhe do produto
│   ├── cart.js         # sacola e favoritos
│   ├── checkout.js     # finalização do pedido
│   └── main.js         # inicialização e seções institucionais
└── assets/img/         # imagens (catálogo, favicon)
```

## ⚙️ Antes de publicar

1. **`js/config.js`**: troque WhatsApp, telefone, e-mail, Instagram, endereço, horário e CNPJ (hoje são exemplos).
2. **`js/data.js`**: ajuste produtos e preços. **Avaliações e depoimentos são exemplos** e devem ser trocados por dados reais.
3. **Fotos reais** (opcional): coloque a imagem em `assets/img/produtos/` e adicione `img: "assets/img/produtos/arquivo.webp"` no produto. A foto substitui a ilustração automática.
4. **Frete e cupons**: edite as faixas por estado e os cupons em `config.js`.

## 🎟️ Cupons de exemplo

| Cupom | Benefício |
|---|---|
| `BEMVINDO10` | 10% OFF |
| `ZECA20` | 20% OFF acima de R$ 250 |
| `FRETEGRATIS` | Frete grátis acima de R$ 80 |
