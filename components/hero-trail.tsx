"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

export default function HeroTrail({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const media = gsap.matchMedia();
    media.add(
      "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
      () => {
        const images = Array.from(
          element.querySelectorAll<HTMLImageElement>(".trail-image"),
        );
        let index = 0;
        let previous = { x: -1000, y: -1000 };
        const clear = () => {
          gsap.killTweensOf(images);
          gsap.set(images, { opacity: 0 });
          previous = { x: -1000, y: -1000 };
        };
        const move = (event: PointerEvent) => {
          if (
            event.pointerType !== "mouse" ||
            (event.target instanceof Element &&
              event.target.closest(
                "a, button, input, textarea, select, [data-interactive]",
              ))
          ) {
            clear();
            return;
          }
          const bounds = element.getBoundingClientRect();
          const x = event.clientX - bounds.left;
          const y = event.clientY - bounds.top;
          if (Math.hypot(x - previous.x, y - previous.y) < 95) return;
          previous = { x, y };
          const image = images[index++ % images.length];
          gsap.killTweensOf(image);
          gsap.set(image, {
            x: x - 60,
            y: y - 72,
            rotation: index % 2 ? -9 : 8,
            scale: 0.85,
            opacity: 1,
          });
          gsap.to(image, { scale: 1, duration: 0.25, ease: "power2.out" });
          gsap.to(image, {
            y: y - 96,
            opacity: 0,
            delay: 0.3,
            duration: 0.5,
            ease: "power2.in",
          });
        };
        element.addEventListener("pointermove", move);
        element.addEventListener("pointerleave", clear);
        return () => {
          element.removeEventListener("pointermove", move);
          element.removeEventListener("pointerleave", clear);
          clear();
        };
      },
    );
    return () => media.revert();
  }, []);
  return (
    <div className="trail-zone" ref={root}>
      {children}
      <div className="trail-layer" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          // Native images are a fixed-size, local decorative animation pool.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            className="trail-image"
            src={`/trail/${["brief", "interface", "flow"][i % 3]}.svg`}
            alt=""
            width="120"
            height="144"
          />
        ))}
      </div>
    </div>
  );
}
