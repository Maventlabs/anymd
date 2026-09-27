"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/* Sequence order requested explicitly. The last frame is the same Capture-Day
   image the hero uses as its static background, so the zoom-in hands off to a
   pixel-identical hero surface before the video crossfades in. */
const frames = [
  "/marquee/Capture-0.png",
  "/marquee/Capture-5.png",
  "/marquee/Capture-4.png",
  "/marquee/Capture-2.png",
  "/marquee/Capture-Day.png",
];

/* Fired the moment the overlay finishes zooming into the hero frame.
   Hero entrance animations wait for this so they are never skipped. */
export const PRELOADER_DONE_EVENT = "anymd:preloader-done";

export default function LayoutPreloader() {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [visible]);

  /* Flag for in-app navigations: preloader only runs on the first document
     load, later mounts of LandingMotion must not wait for another event. */
  useEffect(() => {
    if (visible) return;
    document.documentElement.dataset.preloaderDone = "true";
  }, [visible]);

  useGSAP(
    () => {
      const element = root.current;
      if (!element) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const reduced = gsap.timeline({
          onComplete: () => {
            window.dispatchEvent(new Event(PRELOADER_DONE_EVENT));
            setVisible(false);
          },
        });
        reduced.to(element, { autoAlpha: 0, duration: 0.16, ease: "none" });
        return () => reduced.kill();
      }

      const stage = element.querySelector<HTMLElement>("[data-preload-stage]");
      const frameEls = element.querySelectorAll<HTMLElement>("[data-preload-frame]");

      const timeline = gsap.timeline({
        onComplete: () => {
          window.dispatchEvent(new Event(PRELOADER_DONE_EVENT));
          setVisible(false);
        },
      });

      gsap.set(frameEls, { autoAlpha: 1, clipPath: "inset(0% 0% 100% 0%)" });
      gsap.set(element.querySelectorAll("[data-preload-frame] img"), { scale: 1.16 });
      gsap.set(stage, { autoAlpha: 0, scale: 0.94 });

      timeline
        .to(stage, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power3.out" }, 0);

      frameEls.forEach((frame, index) => {
        const at = 0.18 + index * 0.3;
        timeline
          .to(
            frame,
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: 0.58,
              ease: "power4.out",
            },
            at,
          )
          .to(
            frame.querySelector("img"),
            { scale: 1, duration: 0.9, ease: "power3.out" },
            at,
          );
      });

      /* Zoom into the final frame with a tiny overshoot past the viewport, so
         when the overlay fades the hero's identical Capture-Day background is
         already underneath — the zoom appears to continue straight into the
         page. The longer fade keeps the handoff free of any blink. */
      timeline.add(() => {
        if (!stage) return;
        const rect = stage.getBoundingClientRect();
        const cover =
          Math.max(window.innerWidth / rect.width, window.innerHeight / rect.height) *
          1.02;
        timeline
          .to(stage, { scale: cover, duration: 0.9, ease: "power3.inOut" })
          .to(element, { autoAlpha: 0, duration: 0.5, ease: "power2.out" }, "-=0.1");
      }, 2.35);

      return () => timeline.kill();
    },
    { scope: root },
  );

  if (!visible) return null;

  return (
    <div className="site-preloader" ref={root} aria-hidden="true">
      <div className="preloader-stage" data-preload-stage>
        {frames.map((src, index) => (
          <figure className="preloader-frame" data-preload-frame key={src}>
            {/* Unoptimized: the original PNG bytes are served so the zoomed
                final frame stays as sharp as the hero background it becomes. */}
            <Image
              src={src}
              alt=""
              fill
              unoptimized
              priority={index === 0 || index === frames.length - 1}
            />
          </figure>
        ))}
      </div>
    </div>
  );
}
