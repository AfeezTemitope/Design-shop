export const site = {
  name: "BelzGraphics",
  tagline: "Design & Branding",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://graphics.afeeztemitope.com",
  whatsapp: "2349014465194",
  whatsappDisplay: "0901 446 5194",
  email: "tbelzent@gmail.com",
  instagram: "tbelzbby08",
  tiktok: "afeezcancode",
};

export function waLink(text: string, number = site.whatsapp) {
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

/** Turns 0901..., +234901..., 234901... into 234901... for wa.me links. */
export function toWaNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  return digits;
}
