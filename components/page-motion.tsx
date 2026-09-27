"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PRELOADER_DONE_EVENT } from "@/components/ui/layout-preloader";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type PageMotionProps = {
  children: ReactNode;
  className?: string;
  motionKey?: string | number;
};

export default function PageMotion({
  children,
  className = "",
  motionKey = "initial",
}: PageMotionProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      const armAnimations = () => {
        media.add("(prefers-reduced-motion: no-preference)", () => {
        const reveal = (
          targets: HTMLElement | HTMLElement[],
          trigger: HTMLElement,
          stagger = 0,
        ) => {
          gsap.fromTo(
            targets,
            { autoAlpha: 0, y: 22, filter: "blur(6px)" },
            {
              autoAlpha: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.65,
              stagger,
              ease: "power3.out",
              scrollTrigger: {
                trigger,
                start: "top 88%",
                once: true,
              },
            },
          );
        };

        root.current
          ?.querySelectorAll<HTMLElement>('[data-gsap="reveal"]')
          .forEach((target) => reveal(target, target));

        root.current
          ?.querySelectorAll<HTMLElement>('[data-gsap="group"]')
          .forEach((group) => {
            const items = Array.from(
              group.querySelectorAll<HTMLElement>("[data-gsap-item]"),
            );
            if (items.length) reveal(items, group, 0.055);
          });
      });
      };

      if (document.documentElement.dataset.preloaderDone === "true") {
        armAnimations();
        return () => media.revert();
      }

      let armed = false;
      const fallback = window.setTimeout(() => {
        if (armed) return;
        armed = true;
        armAnimations();
      }, 6000);
      const onDone = () => {
        if (armed) return;
        armed = true;
        window.clearTimeout(fallback);
        armAnimations();
      };
      window.addEventListener(PRELOADER_DONE_EVENT, onDone, { once: true });

      return () => {
        window.clearTimeout(fallback);
        window.removeEventListener(PRELOADER_DONE_EVENT, onDone);
        media.revert();
      };
    },
    { scope: root, dependencies: [motionKey], revertOnUpdate: true },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
