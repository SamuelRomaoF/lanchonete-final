/**
 * Formata um valor numérico para o formato de moeda brasileira (BRL).
 * @param value O valor numérico a ser formatado.
 * @returns String formatada no padrão de moeda brasileira (R$ 0,00).
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
