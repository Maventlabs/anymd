"use client";

import LaserFlow from "@/components/LaserFlow";

export default function HeroLaser() {
  return (
    <div className="hero-laser" aria-hidden="true">
      <LaserFlow
        color="#006eff"
        backgroundColor="#ffffff"
        horizontalBeamOffset={0}
        verticalBeamOffset={0.04}
        horizontalSizing={0.72}
        verticalSizing={2.1}
        fogIntensity={0.22}
        wispIntensity={2.6}
        mouseTiltStrength={0.012}
      />
    </div>
  );
}
