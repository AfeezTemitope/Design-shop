export function naira(amount: number) {
  return "₦" + amount.toLocaleString("en-NG");
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function depositFor(price: number, percent: number) {
  return Math.ceil((price * percent) / 100);
}
