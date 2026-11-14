export function formatGhs(amount: number): string {
  const [whole, fraction] = amount.toFixed(2).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction === '00' ? `GH₵ ${grouped}` : `GH₵ ${grouped}.${fraction}`;
}
