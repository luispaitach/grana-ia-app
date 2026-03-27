export const categories = [
  { id: 'alimentacao', name: 'Alimentação', icon: '🍔', keywords: ['almoço', 'jantar', 'lanche', 'comida', 'restaurante', 'ifood', 'mercado', 'supermercado', 'padaria', 'café', 'pizza', 'hamburguer', 'sushi', 'açai'] },
  { id: 'transporte', name: 'Transporte', icon: '🚗', keywords: ['uber', 'gasolina', 'combustível', '99', 'ônibus', 'metrô', 'estacionamento', 'pedágio', 'moto', 'carro', 'taxi'] },
  { id: 'moradia', name: 'Moradia', icon: '🏠', keywords: ['aluguel', 'condomínio', 'iptu', 'luz', 'energia', 'água', 'gás', 'internet', 'wifi'] },
  { id: 'saude', name: 'Saúde', icon: '💊', keywords: ['farmácia', 'remédio', 'médico', 'consulta', 'dentista', 'hospital', 'exame', 'plano de saúde'] },
  { id: 'educacao', name: 'Educação', icon: '📚', keywords: ['curso', 'faculdade', 'livro', 'escola', 'aula', 'mensalidade', 'material'] },
  { id: 'lazer', name: 'Lazer', icon: '🎮', keywords: ['cinema', 'netflix', 'spotify', 'jogo', 'show', 'festa', 'viagem', 'bar', 'cerveja', 'entretenimento', 'streaming'] },
  { id: 'compras', name: 'Compras', icon: '🛍️', keywords: ['roupa', 'sapato', 'shopping', 'presente', 'eletrônico', 'celular', 'tênis', 'loja'] },
  { id: 'servicos', name: 'Serviços', icon: '🔧', keywords: ['assinatura', 'manutenção', 'conserto', 'seguro', 'faxina', 'lavanderia'] },
  { id: 'investimento', name: 'Investimento', icon: '📈', keywords: ['investimento', 'ação', 'fundo', 'poupança', 'cdb', 'tesouro', 'cripto', 'bitcoin'] },
  { id: 'salario', name: 'Salário', icon: '💰', keywords: ['salário', 'pagamento', 'freela', 'freelance', 'bônus', 'comissão', 'renda', 'receita', 'recebimento'] },
  { id: 'pix', name: 'Pix / Transferência', icon: '💸', keywords: ['pix', 'transferência', 'ted', 'doc', 'empréstimo'] },
  { id: 'outros', name: 'Outros', icon: '📌', keywords: [] },
];

export function findCategory(text) {
  const lower = text.toLowerCase();
  for (const cat of categories) {
    if (cat.keywords.some(k => lower.includes(k))) {
      return cat;
    }
  }
  return categories.find(c => c.id === 'outros');
}
