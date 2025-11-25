// data/items.js
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
  // remove tudo que não for dígito ou vírgula/ponto, normaliza vírgula para ponto
  const cleaned = label.replace(/[^\d,.-]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
};

// cria array final com price (number), priceLabel (string) e slug
const ITEMS = RAW_ITEMS.map(item => {
  const price = parseBRL(item.priceLabel);
  const slug = item.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-çãõáéíóúâêôü]/g, '');
  return {
    ...item,
    price,             // number — use para cálculos
    priceLabel: item.priceLabel, // string — para exibição direta, se preferir
    priceDisplay: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price),
    slug,
  };
});

export default ITEMS;
