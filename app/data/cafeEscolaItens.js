// data/items.js
// const placeholder = (title, w = 160, h = 160) => {
//   const text = encodeURIComponent(String(title || '').slice(0, 20));
//   return `https://via.placeholder.com/${w}x${h}.png?text=${text}`;
// };

const RAW_ITEMS = [
  { id: '1', title: 'Assados', image: require('../../assets/assados.png'), priceLabel: 'R$ 8,50', description: 'Delicioso assado feito na hora.', category: 'Comida' },
  { id: '2', title: 'Misto quente', image: require('../../assets/misto.png'), priceLabel: 'R$ 6,00', description: 'Clássico misto quente, com queijo e presunto.', category: 'Comida' },
  { id: '3', title: 'Sanduiche natural', image: require('../../assets/sanduichenatural.png'), priceLabel: 'R$ 9,00', description: 'Sanduíche leve com recheio natural e verduras.', category: 'Comida' },
  { id: '4', title: 'Bauru', image: require('../../assets/bauru.png'), priceLabel: 'R$ 7,50', description: 'Tradicional bauru com pão francês.', category: 'Comida' },
  { id: '5', title: 'Pão de queijo', image: require('../../assets/pao_de_queijo.png'), priceLabel: 'R$ 3,00', description: 'Pão de queijo quentinho e saboroso.', category: 'Comida' },
  { id: '6', title: 'Achocolatado', image: require('../../assets/achocolatado.png'), priceLabel: 'R$ 4,50', description: 'Bebida achocolatada quente ou gelada.', category: 'Bebida' },
  { id: '7', title: 'Café com leite', image: require('../../assets/cafe_com_leite.png'), priceLabel: 'R$ 5,00', description: 'Café com leite cremoso e quentinho.', category: 'Bebida' },
  { id: '8', title: 'Bolo', image: require('../../assets/bolo.png'), priceLabel: 'R$ 4,50', description: 'Fatia de bolo macio e saboroso.', category: 'Comida' },
  { id: '9', title: 'Salada de fruta', image: require('../../assets/salada_de_fruta.png'), priceLabel: 'R$ 6,00', description: 'Salada de frutas frescas e variadas.', category: 'Comida' },
  { id: '10', title: 'Suco Prats', image: require('../../assets/suco_prats.png'), priceLabel: 'R$ 5,50', description: 'Suco natural Prats, gelado e refrescante.', category: 'Bebida' },
  { id: '11', title: 'Suco lata', image: require('../../assets/suco_lata.png'), priceLabel: 'R$ 4,50', description: 'Suco em lata com sabor intenso de frutas.', category: 'Bebida' },
  { id: '12', title: 'Chá Matte', image: require('../../assets/cha_matte.png'), priceLabel: 'R$ 4,00', description: 'Chá Matte Leão gelado e refrescante.', category: 'Bebida' },
  { id: '13', title: 'Água', image: require('../../assets/agua.png'), priceLabel: 'R$ 3,00', description: 'Água mineral gelada e purificada.', category: 'Bebida' },
];

// util: converte "R$ 8,50" -> 8.5 (number)
const parseBRL = (label) => {
  if (!label) return 0;
  const cleaned = String(label).replace(/[^\d,.-]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};

// cria array final com price (number), priceLabel (string) e slug
const ITEMS = RAW_ITEMS.map(item => {
  const price = parseBRL(item.priceLabel);
  const slug = String(item.title || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-çãõáéíóúâêôü\-]/g, '');
  let priceDisplay = item.priceLabel || `R$ ${price.toFixed(2)}`;
  try {
    if (typeof Intl !== 'undefined' && Intl.NumberFormat) {
      priceDisplay = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
    }
  } catch (e) {
    // fallback mantém priceLabel
  }
  return {
    ...item,
    price,                       // number — use para cálculos
    priceNum: price,             // compatibilidade com outras telas
    priceLabel: item.priceLabel, // string — exibição original
    priceDisplay,
    slug,
  };
});

// adiciona utilitários públicos para as telas consumirem:
const LANCHONETES = {
  central: { id: 'central', name: 'Lanchonete Central', categories: ['Comida', 'Bebida'] },
  padaria: { id: 'padaria', name: 'Padaria', categories: ['Comida'] },
  bebidas: { id: 'bebidas', name: 'Bebidas', categories: ['Bebida'] },
};

/**
 * Retorna todos os itens.
 */
export function getItems() {
  return ITEMS.slice();
}

/**
 * Retorna itens por categoria (ex: 'Comida' ou 'Bebida').
 */
export function getItemsByCategory(category) {
  if (!category) return [];
  return ITEMS.filter(it => String(it.category).toLowerCase() === String(category).toLowerCase());
}

/**
 * Retorna itens para a lanchonete identificada pelo slug.
 */
export function getItemsByLanchonete(slug) {
  if (!slug) return [];
  const ln = LANCHONETES[String(slug)];
  if (!ln) return [];
  const cats = Array.isArray(ln.categories) ? ln.categories.map(c => String(c).toLowerCase()) : [];
  return ITEMS.filter(it => cats.includes(String(it.category).toLowerCase()));
}

/**
 * Retorna objeto da lanchonete (id, name, categories) ou null se não existir.
 */
export function getLanchonete(slug) {
  return LANCHONETES[String(slug)] || null;
}

/**
 * Retorna lista de todas as lanchonetes definidas.
 */
export function getAllLanchonetes() {
  return Object.values(LANCHONETES);
}

export default ITEMS;
