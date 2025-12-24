export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

export function parseCurrency(dollarAmount: string): number {
  const cleaned = dollarAmount.replace(/[^0-9.]/g, '');
  const dollars = parseFloat(cleaned) || 0;
  return Math.round(dollars * 100);
}

export function formatCurrencyInput(cents: number): string {
  const dollars = cents / 100;
  return dollars.toFixed(2);
}