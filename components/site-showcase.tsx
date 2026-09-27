"use client";

import Image from "next/image";
import { Marquee } from "@/components/ui/marquee";

const captures = [
  {
    src: "/marquee/Capture-0.png",
    alt: "Full-page ERA Residence real-estate website reference",
    caption: "ERA Residence · coastal homes with an editorial feel",
  },
  {
    src: "/marquee/Capture-1.png",
    alt: "Full-page product designer portfolio website reference",
    caption: "A product designer's portfolio, showing a complete digital practice",
  },
  {
    src: "/marquee/Capture-2.png",
    alt: "Full-page Melius AI image creation website reference",
    caption: "Melius · image creation for teams exploring new ideas",
  },
  {
    src: "/marquee/Capture-3.png",
    alt: "Full-page Portal freelance services website reference",
    caption: "Portal · proposals, payments, and project delivery for freelancers",
  },
  {
    src: "/marquee/Capture-4.png",
    alt: "Full-page Origin personal finance website reference",
    caption: "Origin · personal finance tools shaped around proactive guidance",
  },
  {
    src: "/marquee/Capture-5.png",
    alt: "Full-page Supaste clipboard history website reference",
    caption: "Supaste · a visual home for saved clipboard content",
  },
  {
    src: "/marquee/Capture-6.png",
    alt: "Full-page space exploration website reference",
    caption: "A cinematic story for a space exploration experience",
  },
  {
    src: "/marquee/Capture-7.png",
    alt: "Full-page Wandor travel planning website reference",
    caption: "Wandor · trips shaped around places and experiences you love",
  },
  {
    src: "/marquee/Capture-Vulpix.png",
    alt: "Full-page Vulpix open-source AI website reference",
    caption: "Vulpix · an open-source directory for exploring AI models",
  },
];

function CaptureCard({
  src,
  alt,
  caption,
}: (typeof captures)[number]) {
  return (
    <figure className="showcase-capture">
      <div className="showcase-capture-image">
        <Image
          src={src}
          alt={alt}
          width={1864}
          height={1000}
          sizes="(max-width: 768px) 88vw, 56vw"
          loading="lazy"
        />
      </div>
      <figcaption>
        <span className="showcase-caption">{caption}</span>
      </figcaption>
    </figure>
  );
}

export default function SiteShowcase() {
  return (
    <div
      className="showcase-marquees"
      role="region"
      aria-label="Full-page website captures"
    >
      <Marquee pauseOnHover repeat={3} className="preview-marquee">
        {captures.map((capture) => (
          <CaptureCard key={capture.src} {...capture} />
        ))}
      </Marquee>
      <Marquee
        reverse
        pauseOnHover
        repeat={3}
        className="preview-marquee preview-marquee-secondary"
      >
        {[...captures].reverse().map((capture) => (
          <CaptureCard key={capture.src} {...capture} />
        ))}
      </Marquee>
    </div>
  );
}
