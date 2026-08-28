"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SpotlightProps {
  className?: string;
  size?: number;
}

export function Spotlight({
  className,
  size = 420,
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLElement | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const parent = parentRef.current;
      const spot = spotRef.current;

      if (!parent || !spot) return;

      const rect = parent.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      spot.style.opacity = "1";

      spot.style.transform = `translate3d(
        ${x - size / 2}px,
        ${y - size / 2}px,
        0
      )`;
    },
    [size]
  );

  const handleMouseEnter = useCallback(() => {
    const spot = spotRef.current;

    if (spot) {
      spot.style.opacity = "1";
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    const spot = spotRef.current;

    if (spot) {
      spot.style.opacity = "0";
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const parent = container.parentElement;

    if (!parent) return;

    parentRef.current = parent;

    parent.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("mouseenter", handleMouseEnter);
    parent.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      parent.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("mouseenter", handleMouseEnter);
      parent.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseEnter, handleMouseLeave]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      <div
        ref={spotRef}
        className="absolute left-0 top-0 rounded-full opacity-0 transition-opacity duration-200"
        style={{
          width: size,
          height: size,
          background:
            "radial-gradient(circle, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.30) 22%, rgba(255,255,255,0.12) 42%, rgba(255,255,255,0.04) 58%, transparent 74%)",
          filter: "blur(52px)",
          willChange: "transform, opacity",
        }}
      />
    </div>
  );
}