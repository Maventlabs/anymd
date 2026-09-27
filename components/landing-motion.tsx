"use client";

import { useRef, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PRELOADER_DONE_EVENT } from "@/components/ui/layout-preloader";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const media = gsap.matchMedia();
      const entranceSelector =
        '[data-gsap-hero], .hero-cloud-transition';

      /* Hide every hero entrance target before the first paint so nothing
         flashes "visible → hidden → animate in" while the preloader zoom
         settles into the hero. gsap.set is synchronous inside this layout
         effect, so the hidden state wins the first painted frame. */
      gsap.set(entranceSelector, { autoAlpha: 0 });

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(entranceSelector, { autoAlpha: 1 });
        return () => media.revert();
      }

      const armAnimations = () => {
        media.add("(prefers-reduced-motion: no-preference)", () => {
        const heroTargets = [
          "nav",
          "brand",
          "attribution",
          "copy",
          "composer",
          "proof",
        ].flatMap((part) =>
          gsap.utils.toArray<HTMLElement>(
            `[data-gsap-hero="${part}"]`,
            root.current ?? undefined,
          ),
        );
        const heroItems = new Set(heroTargets);
        if (heroTargets.length) {
          const timeline = gsap.timeline();
          heroTargets.forEach((element, index) => {
            timeline.fromTo(
              element,
              { autoAlpha: 0, y: 24 },
              {
                autoAlpha: 1,
                y: 0,
                duration: 0.62,
                ease: "power3.out",
              },
              /* Brief breath on the still hero shot after the zoom, then the
                 copy, wizard and proof animate in together. */
              index === 0 ? 0.55 : "-=0.3",
            );
          });
        }

        /* The white cloud bridge rises in with the rest of the hero — GSAP
           owns the whole entrance so the bridge never pops in abruptly. */
        const cloud = root.current?.querySelector<HTMLElement>(".hero-cloud-transition");
        if (cloud) {
          gsap.fromTo(
            cloud,
            { autoAlpha: 0, y: 46 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 1.05,
              ease: "power2.out",
              delay: 0.35,
            },
          );
          gsap.to(cloud, {
            "--cloud-drift": "14px",
            duration: 12,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        }

        const grouped = new Set<HTMLElement>();
        gsap.utils
          .toArray<HTMLElement>('[data-gsap="group"]', root.current ?? undefined)
          .forEach((group) => {
            const items = Array.from(
              group.querySelectorAll<HTMLElement>("[data-gsap-item]"),
            ).filter((item) => !heroItems.has(item));
            items.forEach((item) => grouped.add(item));
            if (!items.length) return;
            gsap.fromTo(
              items,
              { autoAlpha: 0, y: 22, filter: "blur(5px)" },
              {
                autoAlpha: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.68,
                stagger: 0.09,
                ease: "power3.out",
                scrollTrigger: { trigger: group, start: "top 86%", once: true },
              },
            );
          });

        gsap.utils
          .toArray<HTMLElement>(
            '[data-reveal], [data-gsap="reveal"]',
            root.current ?? undefined,
          )
          .filter((element) => !grouped.has(element) && !heroItems.has(element))
          .forEach((element) => {
            gsap.fromTo(
              element,
              { autoAlpha: 0, y: 28, filter: "blur(8px)" },
              {
                autoAlpha: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.82,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: element,
                  start: "top 88%",
                  once: true,
                },
              },
            );
          });

        gsap.utils
          .toArray<HTMLElement>("[data-motion-line]", root.current ?? undefined)
          .forEach((element) => {
            gsap.fromTo(
              element,
              { scaleX: 0 },
              {
                scaleX: 1,
                duration: 1,
                ease: "expo.out",
                transformOrigin: "left center",
                scrollTrigger: {
                  trigger: element,
                  start: "top 92%",
                  once: true,
                },
              },
            );
          });
      });
      };

      /* The preloader locks the viewport for ~3.5s; hero entrances would fire
         underneath it and be finished before the reveal. Hold every entrance
         and scroll reveal until the preloader signals completion, with a
         safety fallback so nothing stays hidden if the overlay ever fails. */
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
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
