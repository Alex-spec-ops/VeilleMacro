import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AnimatedGradientText({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative inline-flex items-center justify-center rounded-full",
        "bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm",
        "shadow-[inset_0_-4px_8px_#8fdfff18]",
        "transition-shadow duration-500 [--bg-size:300%]",
        "hover:shadow-[inset_0_-4px_8px_#8fdfff35]",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 block h-full w-full rounded-[inherit]",
          "animate-gradient bg-gradient-to-r from-[#a855f7]/60 via-[#3b82f6]/60 to-[#a855f7]/60",
          "bg-[length:var(--bg-size)_100%] p-px",
          "![mask-composite:subtract]",
          "[mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]"
        )}
      />
      <span className="relative z-10">{children}</span>
    </div>
  );
}
