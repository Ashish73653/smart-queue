export function formatCurrency(amount: number) {
  if (Number.isNaN(amount)) return "₹0";
  return `₹${amount.toFixed(0)}`;
}

export function formatDuration(minutes: number) {
  if (!minutes || Number.isNaN(minutes)) return "0 min";
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs && mins) return `${hrs} hr ${mins} min`;
  if (hrs) return `${hrs} hr`;
  return `${mins} min`;
}
