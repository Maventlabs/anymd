"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP);

type SplitTextProps = {
  text: string;
  id?: string;
  className?: string;
  delay?: number;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
  textAlign?: CSSProperties["textAlign"];
};

export default function SplitText({
  text,
  id,
  className = "",
  delay = 34,
  tag: Tag = "span",
  textAlign,
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    void document.fonts.ready.then(() => setFontsLoaded(true));
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !fontsLoaded) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const split = new GSAPSplitText(ref.current, {
        type: "words",
        wordsClass: "split-word",
      });
      gsap.fromTo(
        split.words,
        { opacity: reduce ? 1 : 0, yPercent: reduce ? 0 : 72 },
        {
          opacity: 1,
          yPercent: 0,
          duration: reduce ? 0 : 0.8,
          stagger: reduce ? 0 : delay / 1000,
          ease: "power3.out",
          scrollTrigger: reduce
            ? undefined
            : { trigger: ref.current, start: "top 88%", once: true },
        },
      );
      return () => split.revert();
    },
    { dependencies: [text, delay, fontsLoaded], scope: ref },
  );

  return (
    <Tag
      ref={ref as React.Ref<never>}
      id={id}
      className={`split-parent ${className}`}
      style={{ textAlign }}
    >
      {text}
    </Tag>
  );
}
