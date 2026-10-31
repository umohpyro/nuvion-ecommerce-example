import { cn } from "@/lib/utils";

/** Placeholder artwork drawn with CSS, so the example ships no image files. Replace with real photos. */
export function ProductArt({ tone, name, className }: { tone: string; name: string; className?: string }) {
  return (
    <div role="img" aria-label={`${name} product artwork`} className={cn("relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-gradient-to-br", tone, className)}>
      <div className="absolute -right-8 -top-8 size-40 rounded-full bg-white/20" />
      <div className="absolute -bottom-10 -left-6 size-44 rounded-full bg-black/10" />
      <svg viewBox="0 0 64 64" className="relative size-1/3 text-white/90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14 24h32v14a12 12 0 0 1-12 12h-8A12 12 0 0 1 14 38V24Z" />
        <path d="M46 28h4a5 5 0 0 1 0 10h-4" />
        <path d="M24 12c0 4 4 4 4 8M34 12c0 4 4 4 4 8" />
      </svg>
    </div>
  );
}
