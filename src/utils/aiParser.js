import { findCategory } from './categories';

const accountKeywords = {
  nubank: ['nubank', 'nu', 'roxinho'],
  itau: ['itaú', 'itau', 'iti'],
  picpay: ['picpay', 'pic pay'],
};

export function parseAIInput(text, accounts) {
  const lower = text.toLowerCase().trim();

  // Extract amount — supports "R$ 50", "50 reais", "50,00", "50.00", just "50"
  const amountPatterns = [
    /r\$\s*([\d.,]+)/i,
    /([\d.,]+)\s*reais/i,
    /([\d.,]+)\s*real/i,
    /(?:^|\s)([\d]+(?:[.,]\d{1,2})?)\b/,
  ];

  let amount = 0;
  for (const pattern of amountPatterns) {
    const match = lower.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace('.', '').replace(',', '.'));
      if (!isNaN(amount) && amount > 0) break;
    }
  }

  // Detect type
  const incomeKeywords = ['recebi', 'ganhei', 'salário', 'salario', 'entrada', 'recebimento', 'freela', 'renda', 'vendi', 'depósito', 'deposito'];
  const isIncome = incomeKeywords.some(k => lower.includes(k));
  const type = isIncome ? 'income' : 'expense';

  // Detect account
  let detectedAccountId = null;
  if (accounts && accounts.length > 0) {
    for (const [key, keywords] of Object.entries(accountKeywords)) {
      if (keywords.some(k => lower.includes(k))) {
        const acc = accounts.find(a => a.name.toLowerCase().includes(key));
        if (acc) {
          detectedAccountId = acc.id;
          break;
        }
      }
    }
    // Also check if any account name directly appears in text
    if (!detectedAccountId) {
      for (const acc of accounts) {
        if (lower.includes(acc.name.toLowerCase())) {
          detectedAccountId = acc.id;
          break;
        }
      }
    }
  }

  // Detect category
  const category = findCategory(text);

  // Build description — clean up the original text
  const description = text.trim();

  return {
    amount,
    type,
    category: category.id,
    categoryName: category.name,
    accountId: detectedAccountId,
    description,
    date: new Date().toISOString(),
    confidence: amount > 0 ? 'high' : 'low',
  };
}
