type P = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  viewBox: "0 0 24 24",
};

export const ChatIcon = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><path d="M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 21l2.2-5.2A8.5 8.5 0 1 1 21 11.5z" /></svg>
);
export const BackIcon = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><path d="M15 6l-6 6 6 6" /></svg>
);
export const CloseIcon = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const SearchIcon = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
);
export const PlusIcon = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><path d="M12 5v14M5 12h14" /></svg>
);
export const ShopIcon = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></svg>
);
export const UserIcon = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);
export const MailIcon = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 7l9 6 9-6" /></svg>
);
export const TrashIcon = ({ className = "size-5" }: P) => (
  <svg {...base} className={className}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
);
export const PlayIcon = ({ className = "size-6" }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}><path d="M8 5v14l11-7z" /></svg>
);
