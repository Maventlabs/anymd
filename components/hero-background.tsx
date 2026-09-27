"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/*
 * Three-surface hero handoff, tuned to feel like one continuous shot:
 *
 * 1. `.hero-background::before` shows Capture-Day.png with the same
 *    `100svh` cover crop the preloader zooms into — the preloader's last
 *    frame is literally replaced by this surface, so nothing jumps.
 * 2. The video sits hidden (CSS opacity 0) but already playing, muted and
 *    looped from 0s.
 * 3. After the preloader completes plus a ~2.5s hold on the still image,
 *    the wrapper gets `.is-playing` and the video fades in over 1.4s from
 *    its own 0s timestamp. The still stays underneath, so the swap can
 *    never blink.
 */

const HOLD_STILL_MS = 2500;

export default function HeroBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const wrap = video?.parentElement;
    if (!video || !wrap) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onMotionChange = () => {
      if (motionPreference.matches) {
        video.pause();
        return;
      }
      void video.play().catch(() => undefined);
    };

    const scheduleFade = () => {
      const fadeAt = Number(wrap.dataset.fadeAt || 0);
      const wait = Math.max(0, fadeAt - Date.now());
      window.setTimeout(() => {
        wrap.dataset.faded = "1";
        /* GSAP drives the fade (rAF inline styles) so the reveal behaves
           identically everywhere, including non-composited previews. */
        gsap.to(video, {
          opacity: 1,
          duration: 1.4,
          ease: "power2.inOut",
          overwrite: "auto",
        });
      }, wait);
    };

    /* Idempotent across Fast Refresh / StrictMode effect re-runs: state lives
       on the wrapper, and every run reconciles the CURRENT video node. */
    if (wrap.dataset.playArmed !== "1") {
      wrap.dataset.playArmed = "1";

      /* Start from the video's own 0s, hidden under the still. */
      try {
        if (video.readyState >= 1) video.currentTime = 0;
      } catch {
        /* currentTime before metadata is a no-op; autoplay still starts at 0. */
      }
      void video.play().catch(() => undefined);

      const armFade = () => {
        if (wrap.dataset.fadeAt) {
          scheduleFade();
          return;
        }
        wrap.dataset.fadeAt = String(Date.now() + HOLD_STILL_MS);
        scheduleFade();
      };

      if (document.documentElement.dataset.preloaderDone === "true") {
        armFade();
      } else {
        window.addEventListener("anymd:preloader-done", armFade, { once: true });
      }
    } else {
      void video.play().catch(() => undefined);

      /* Reconcile this node with the wrapper's fade state. */
      if (wrap.dataset.faded === "1") {
        gsap.set(video, { opacity: 1 });
      } else if (wrap.dataset.fadeAt) {
        scheduleFade();
      }
    }

    motionPreference.addEventListener("change", onMotionChange);
    return () => motionPreference.removeEventListener("change", onMotionChange);
  }, []);

  return (
    <div className="hero-background" aria-hidden="true">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        tabIndex={-1}
      >
        <source src="/hero-background-av1.webm" type="video/webm" />
        <source src="/hero-background.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
