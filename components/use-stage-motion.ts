"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

export function useStageMotion(key: string) {
  const stage = useRef<HTMLDivElement>(null);
  const context = useRef<gsap.Context | null>(null);
  const locked = useRef(true);
  const [busy, setBusy] = useState(true);

  useLayoutEffect(() => {
    const media = gsap.matchMedia();
    const ctx = gsap.context(() => {
      media.add(
        {
          reduce: "(prefers-reduced-motion: reduce)",
          normal: "(prefers-reduced-motion: no-preference)",
        },
        (match) => {
          gsap.fromTo(
            stage.current,
            {
              opacity: match.conditions?.reduce ? 1 : 0,
              y: match.conditions?.reduce ? 0 : 12,
            },
            {
              opacity: 1,
              y: 0,
              duration: match.conditions?.reduce ? 0 : 0.3,
              ease: "power2.out",
              onComplete: () => {
                locked.current = false;
                setBusy(false);
                stage.current
                  ?.querySelector<HTMLElement>("[data-stage-heading]")
                  ?.focus();
              },
            },
          );
        },
      );
    }, stage);
    context.current = ctx;
    return () => {
      locked.current = true;
      media.revert();
      ctx.revert();
      context.current = null;
    };
  }, [key]);

  function leave(action: () => void) {
    if (locked.current || !context.current) return;
    locked.current = true;
    setBusy(true);
    context.current.add(() => {
      gsap.to(stage.current, {
        opacity: 0,
        y: -8,
        duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 0.18,
        ease: "power2.in",
        onComplete: action,
      });
    });
  }
  return { stage, busy, leave };
}
