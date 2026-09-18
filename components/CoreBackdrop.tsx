"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { resolveTheme, type ThemeMode } from "@/lib/theme";

const EarthHorizon = dynamic(
  () => import("@/components/EarthHorizon").then((mod) => mod.EarthHorizon),
  { ssr: false },
);

export function MobileAtmosphere() {
  return <div className="mobile-atmosphere" aria-hidden="true" />;
}

export function CoreBackdrop() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setEnabled(desktop.matches);
      setReducedMotion(motion.matches);
      setTheme(resolveTheme());
    };
    sync();
    desktop.addEventListener("change", sync);
    motion.addEventListener("change", sync);

    const onTheme = () => setTheme(resolveTheme());
    window.addEventListener("storage", onTheme);
    const observer = new MutationObserver(onTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      desktop.removeEventListener("change", sync);
      motion.removeEventListener("change", sync);
      window.removeEventListener("storage", onTheme);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || !enabled) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry?.isIntersecting ?? false),
      { threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) setVisible(false);
      else if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setVisible(rect.bottom > 0 && rect.top < window.innerHeight);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (!enabled) return null;

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none fixed inset-0 z-0 hidden lg:block ${
        theme === "light" ? "opacity-55" : "opacity-70"
      }`}
      aria-hidden="true"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, transparent 58%, black 86%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, transparent 58%, black 86%)",
      }}
    >
      <EarthHorizon
        reducedMotion={reducedMotion}
        theme={theme}
        active={visible && !reducedMotion}
      />
    </div>
  );
}
