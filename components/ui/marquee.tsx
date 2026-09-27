"use client";

import { useRef, type ComponentPropsWithoutRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  const root = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Tween | null>(null);
  const copies = Array.from({ length: Math.max(2, repeat) }, (_, index) => index);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const track = root.current?.querySelector<HTMLElement>(".marquee-track");
        const firstCopy = track?.querySelector<HTMLElement>(".marquee-copy");
        if (!track || !firstCopy) return;

        const readDuration = () => {
          const raw = getComputedStyle(root.current!).getPropertyValue("--duration");
          return Number.parseFloat(raw) || 40;
        };
        const getDistance = () =>
          vertical ? firstCopy.offsetHeight : firstCopy.offsetWidth;

        const animate = () => {
          const distance = getDistance();
          if (!distance) return;
          timeline.current?.kill();
          timeline.current = gsap.fromTo(
            track,
            vertical
              ? { y: reverse ? -distance : 0 }
              : { x: reverse ? -distance : 0 },
            {
              ...(vertical
                ? { y: reverse ? 0 : -distance }
                : { x: reverse ? 0 : -distance }),
              duration: readDuration(),
              repeat: -1,
              ease: "none",
            },
          );
        };

        animate();
        const observer = new ResizeObserver(animate);
        observer.observe(firstCopy);
        return () => {
          observer.disconnect();
          timeline.current?.kill();
          timeline.current = null;
        };
      });
      return () => media.revert();
    },
    { scope: root },
  );

  function pause() {
    timeline.current?.pause();
  }

  function resume() {
    timeline.current?.play();
  }

  return (
    <div
      {...props}
      ref={root}
      className={cn(
        "marquee-window",
        vertical ? "marquee-window-vertical" : "",
        className,
      )}
      onPointerEnter={pauseOnHover ? pause : undefined}
      onPointerLeave={pauseOnHover ? resume : undefined}
      onFocusCapture={pauseOnHover ? pause : undefined}
      onBlurCapture={(event) => {
        if (
          pauseOnHover &&
          !event.currentTarget.contains(event.relatedTarget as Node | null)
        ) {
          resume();
        }
      }}
    >
      <div className="marquee-track" aria-live="off">
        {copies.map((copy) => (
          <div
            className="marquee-copy"
            aria-hidden={copy > 0 ? true : undefined}
            key={copy}
          >
            {children}
          </div>
        ))}
      </div>
    </div>
  );
}
