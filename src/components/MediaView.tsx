import { cld, videoPoster } from "@/lib/cloudinary";

type Props = {
  url: string;
  type: "IMAGE" | "VIDEO";
  alt: string;
  width?: number;
  className?: string;
  /** Cards show a still frame; the design page plays the video. */
  playable?: boolean;
  priority?: boolean;
};

export function MediaView({ url, type, alt, width = 800, className = "", playable = false, priority = false }: Props) {
  if (type === "VIDEO") {
    const poster = videoPoster(url, width);
    if (!playable && poster) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={poster} alt={alt} loading={priority ? "eager" : "lazy"} className={`object-cover ${className}`} />;
    }
    return (
      <video
        src={cld(url, "q_auto")}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        className={`bg-ink object-contain ${className}`}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cld(url, `f_auto,q_auto,w_${width}`)}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`object-cover ${className}`}
    />
  );
}
