export function formatDateRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const month = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long' });
  if (sameMonth) return `${start.getDate()}–${end.getDate()} ${month(end)} ${end.getFullYear()}`;
  return `${start.getDate()} ${month(start)} – ${end.getDate()} ${month(end)} ${end.getFullYear()}`;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function km(n: number): string {
  return `${n.toLocaleString('en-GB')} km`;
}

export function metres(n: number): string {
  return `${n.toLocaleString('en-GB')} m`;
}
