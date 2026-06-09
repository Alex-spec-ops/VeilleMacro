import { cn } from "@/lib/utils";

interface BackgroundOrbsProps {
  className?: string;
  intensity?: "low" | "medium" | "high";
}

export function BackgroundOrbs({ className, intensity = "medium" }: BackgroundOrbsProps) {
  const opacity = intensity === "low" ? "opacity-20" : intensity === "high" ? "opacity-60" : "opacity-35";

  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {/* SVG blur filter */}
      <svg className="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix in="blur" mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8" result="goo" />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      <div className={cn("absolute inset-0 blur-3xl", opacity)} style={{ filter: "url(#blurMe)" }}>
        {/* Orb 1 — violet */}
        <div
          className="absolute top-1/2 left-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 animate-move-vertical rounded-full mix-blend-hard-light"
          style={{ background: "radial-gradient(circle at center, #7c3aed 0%, transparent 70%)" }}
        />
        {/* Orb 2 — blue */}
        <div
          className="absolute top-1/2 left-1/3 h-[50%] w-[50%] -translate-x-1/2 -translate-y-1/2 animate-move-circle rounded-full mix-blend-hard-light"
          style={{ background: "radial-gradient(circle at center, #2563eb 0%, transparent 70%)" }}
        />
        {/* Orb 3 — teal */}
        <div
          className="absolute top-1/3 left-2/3 h-[45%] w-[45%] -translate-x-1/2 -translate-y-1/2 animate-move-horizontal rounded-full mix-blend-hard-light"
          style={{ background: "radial-gradient(circle at center, #0d9488 0%, transparent 70%)" }}
        />
        {/* Orb 4 — purple (slow) */}
        <div
          className="absolute bottom-1/4 left-1/4 h-[40%] w-[40%] animate-move-circle-slow rounded-full mix-blend-hard-light"
          style={{ background: "radial-gradient(circle at center, #9333ea 0%, transparent 70%)" }}
        />
        {/* Orb 5 — indigo */}
        <div
          className="absolute top-1/4 right-1/4 h-[35%] w-[35%] animate-move-vertical rounded-full mix-blend-hard-light"
          style={{
            background: "radial-gradient(circle at center, #4f46e5 0%, transparent 70%)",
            animationDelay: "-10s",
          }}
        />
      </div>
    </div>
  );
}
