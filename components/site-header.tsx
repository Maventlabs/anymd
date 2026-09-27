"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, CircleUserRound, Menu, X } from "lucide-react";
import BrandLogo from "@/components/brand-logo";

type SiteHeaderProps = {
  signedIn: boolean;
  userImage?: string | null;
};

const navigation = [
  { href: "#how-it-works", label: "Features", id: "features" },
  { href: "#faq", label: "FAQ", id: "faq" },
  { href: "#output", label: "Output", id: "output" },
  { href: "#principles", label: "Approach", id: "approach" },
  { href: "#visual-direction", label: "Visual", id: "visual" },
  { href: "#pricing", label: "Pricing", id: "pricing" },
];

type ForegroundTone = "light" | "dark";

function luminanceFromColor(color: string): number | null {
  const values = color.match(/[\d.]+/g)?.map(Number);
  if (!values || values.length < 3 || (values[3] ?? 1) < 0.85) return null;

  const linearize = (value: number) => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  };

  return (
    0.2126 * linearize(values[0]) +
    0.7152 * linearize(values[1]) +
    0.0722 * linearize(values[2])
  );
}

function backgroundLuminanceAt(x: number, y: number): number | null {
  let element = document.elementFromPoint(x, y);

  while (element && element !== document.documentElement) {
    const luminance = luminanceFromColor(getComputedStyle(element).backgroundColor);
    if (luminance !== null) return luminance;
    element = element.parentElement;
  }

  return null;
}

function isBrandBlueAt(x: number, y: number): boolean {
  let element = document.elementFromPoint(x, y);

  while (element && element !== document.documentElement) {
    const values = getComputedStyle(element).backgroundColor.match(/[\d.]+/g)?.map(Number);
    if (values && values.length >= 3 && (values[3] ?? 1) >= 0.85) {
      const [red, green, blue] = values;
      return red <= 24 && green >= 78 && green <= 150 && blue >= 210 && blue - red >= 175;
    }
    element = element.parentElement;
  }

  return false;
}

export default function SiteHeader({
  signedIn,
  userImage,
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const [contrast, setContrast] = useState<ForegroundTone>("light");
  const [onBrandBlue, setOnBrandBlue] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 4;
    canvas.height = 2;
    const context = canvas.getContext("2d", { willReadFrequently: true });

    const sampleVideo = (video: HTMLVideoElement): number | null => {
      if (!context || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        return null;
      }

      try {
        const stripHeight = Math.max(1, Math.round(video.videoHeight * 0.1));
        context.drawImage(
          video,
          0,
          0,
          video.videoWidth,
          stripHeight,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let total = 0;

        for (let index = 0; index < pixels.length; index += 4) {
          total +=
            0.2126 * (pixels[index] / 255) +
            0.7152 * (pixels[index + 1] / 255) +
            0.0722 * (pixels[index + 2] / 255);
        }

        // The hero scrim darkens the video behind the fixed header.
        return (total / (pixels.length / 4)) * 0.56;
      } catch {
        return null;
      }
    };

    const sample = () => {
      const header = headerRef.current;
      if (!header) return;

      const bounds = header.getBoundingClientRect();
      const sampleY = Math.min(window.innerHeight - 1, bounds.bottom + 4);
      const sampleXs = [0.18, 0.5, 0.82].map((ratio) => window.innerWidth * ratio);
      setOnBrandBlue(sampleXs.some((x) => isBrandBlueAt(x, sampleY)));
      const hero = document.querySelector<HTMLElement>(".hero-video-surface");
      const heroBounds = hero?.getBoundingClientRect();
      const video = hero?.querySelector("video");
      let luminance =
        heroBounds && heroBounds.top <= sampleY && heroBounds.bottom > sampleY && video
          ? sampleVideo(video)
          : null;

      if (luminance === null) {
        const samples = sampleXs
          .map((x) => backgroundLuminanceAt(x, sampleY))
          .filter((value): value is number => value !== null);

        if (samples.length) {
          luminance = samples.reduce((total, value) => total + value, 0) / samples.length;
        }
      }

      if (luminance === null) return;

      setContrast((current) => {
        if (current === "light") return luminance! > 0.58 ? "dark" : "light";
        return luminance! < 0.42 ? "light" : "dark";
      });
    };

    let frame = 0;
    const scheduleSample = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        sample();
      });
    };

    sample();
    const timer = window.setInterval(sample, 700);
    window.addEventListener("scroll", scheduleSample, { passive: true });
    window.addEventListener("resize", scheduleSample);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("scroll", scheduleSample);
      window.removeEventListener("resize", scheduleSample);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function closeMenu() {
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape" && open) {
      closeMenu();
      triggerRef.current?.focus();
    }
  }

  return (
    <header
      ref={headerRef}
      className={`site-header ${signedIn ? "is-signed-in" : "is-signed-out"}${open ? " is-menu-open" : ""}`}
      data-contrast={contrast}
      data-accent-background={onBrandBlue ? "brand" : undefined}
      data-gsap-hero="nav"
      onKeyDown={handleKeyDown}
    >
      <div className="site-header-inner">
        <Link className="wordmark" href="/" aria-label="AnyMD home">
          <BrandLogo className="wordmark-image" />
        </Link>

        <nav className="site-nav-links" aria-label="Main navigation">
          {navigation.map(({ href, label, id }) => (
            <a
              className={`site-nav-item nav-item-${id}`}
              key={href}
              href={href}
              onClick={closeMenu}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="site-nav-actions">
          <div className="site-nav-account">
            {signedIn ? (
              <Link className="nav-profile" href="/profile" aria-label="Profile">
                <span className="nav-avatar" aria-hidden="true">
                  {userImage ? (
                    <Image
                      className="nav-avatar-image"
                      src={userImage}
                      alt=""
                      fill
                      sizes="32px"
                      unoptimized
                    />
                  ) : (
                    <CircleUserRound className="nav-avatar-fallback" aria-hidden="true" />
                  )}
                </span>
              </Link>
            ) : (
              <>
                <Link className="site-login" href="/login">Log in</Link>
                <Link className="nav-cta site-signup" href="/signup">Sign up</Link>
              </>
            )}
          </div>

          {signedIn ? (
            <a className="nav-cta site-header-cta" href="#idea">
              Start with an idea <ArrowUpRight aria-hidden="true" />
            </a>
          ) : null}
        </div>

        <button
          ref={triggerRef}
          className="site-mobile-toggle"
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="site-mobile-navigation"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {open ? (
        <nav
          className="site-mobile-menu"
          id="site-mobile-navigation"
          aria-label="Mobile navigation"
        >
          <div className="site-mobile-links">
            {navigation.map(({ href, label, id }) => (
              <a
                className={`site-nav-item nav-item-${id}`}
                key={href}
                href={href}
                onClick={closeMenu}
              >
                {label}
              </a>
            ))}
          </div>
          <div className="site-mobile-actions">
            {signedIn ? (
              <Link
                className="site-mobile-profile"
                href="/profile"
                aria-label="Profile"
                onClick={closeMenu}
              >
                <span className="nav-avatar" aria-hidden="true">
                  {userImage ? (
                    <Image
                      className="nav-avatar-image"
                      src={userImage}
                      alt=""
                      fill
                      sizes="32px"
                      unoptimized
                    />
                  ) : (
                    <CircleUserRound className="nav-avatar-fallback" aria-hidden="true" />
                  )}
                </span>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={closeMenu}>
                  Log in
                </Link>
                <Link className="nav-cta" href="/signup" onClick={closeMenu}>
                  Sign up
                </Link>
              </>
            )}
          </div>
          {signedIn ? (
            <a className="nav-cta" href="#idea" onClick={closeMenu}>
              Start with an idea <ArrowUpRight aria-hidden="true" />
            </a>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
