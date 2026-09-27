"use client";

import { useRef } from "react";

/*
 * Giant outline wordmark with a cursor-tracked reveal: a bold navy fill
 * follows the pointer inside a circular radius, per the reference.
 */
export default function FooterGiant() {
  const ref = useRef<HTMLParagraphElement>(null);

  function handleMove(event: React.MouseEvent) {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    element.style.setProperty("--my", `${event.clientY - rect.top}px`);
  }

  return (
    <p
      ref={ref}
      className="footer-giant"
      aria-hidden="true"
      onMouseMove={handleMove}
    >
      <span className="footer-giant-fill" aria-hidden="true">
        Mavent
      </span>
      Mavent
    </p>
  );
}
