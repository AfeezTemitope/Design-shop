/** Adds Cloudinary transformations (auto format/quality, width) to a delivery URL. */
export function cld(url: string, transform = "f_auto,q_auto") {
  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  return url.replace("/upload/", `/upload/${transform}/`);
}

/** A still frame for a Cloudinary video, used as the poster and as the card cover. */
export function videoPoster(url: string, width = 800) {
  if (!url.includes("/video/upload/")) return undefined;
  return url
    .replace("/upload/", `/upload/so_0,w_${width},f_jpg,q_auto/`)
    .replace(/\.[a-z0-9]+(\?.*)?$/i, ".jpg");
}

export function isCloudinaryUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export function mediaTypeFromUrl(url: string): "IMAGE" | "VIDEO" {
  return url.includes("/video/upload/") ? "VIDEO" : "IMAGE";
}
