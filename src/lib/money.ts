/** Nuvion amounts are integers in the smallest currency unit: 1000 USD is $10.00. This shop sells in USD only. */
export const CURRENCY = "USD";

export function formatMoney(minor: number, currency: string = CURRENCY): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(minor / 100);
}

export const formatDate = (ms: number) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(ms);
