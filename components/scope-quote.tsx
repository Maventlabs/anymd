"use client";

import { useState } from "react";
import Image from "next/image";

const quotes = [
  {
    text: "In preparing for battle I have always found that plans are useless, but planning is indispensable.",
    name: "Dwight D. Eisenhower",
    role: "U.S. President, 1953–1961",
    tab: "Planning",
    image: "/Banner/Banner-1.png",
    imageAlt: "A campsite under a starry night sky",
    caption: "Plan first, build once.",
  },
  {
    text: "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.",
    name: "Antoine de Saint-Exupéry",
    role: "Writer and aviator",
    tab: "Product",
    image: "/Banner/Banner-2.png",
    imageAlt: "A small seaside shop glowing at dusk",
    caption: "Nothing left to take away.",
  },
  {
    text: "Design is not just what it looks like and feels like. Design is how it works.",
    name: "Steve Jobs",
    role: "Co-founder, Apple",
    tab: "Design",
    image: "/Banner/Banner-3.png",
    imageAlt: "A forest shop glowing in the rain",
    caption: "Design is how it works.",
  },
];

export default function ScopeQuote() {
  const [index, setIndex] = useState(0);
  const quote = quotes[index];

  return (
    <figure className="scope-quote-card" data-gsap="reveal">
      <div className="scope-quote-main">
        <blockquote key={index} className="scope-quote-text">
          <p>“{quote.text}”</p>
          <figcaption>
            <strong>{quote.name}</strong>
            <span>{quote.role}</span>
          </figcaption>
        </blockquote>
        <div className="scope-quote-tabs" role="tablist" aria-label="Quote categories">
          {quotes.map((item, position) => (
            <button
              key={item.tab}
              role="tab"
              aria-selected={position === index}
              className={`scope-quote-tab${position === index ? " is-active" : ""}`}
              onClick={() => setIndex(position)}
              type="button"
            >
              {item.tab}
            </button>
          ))}
        </div>
      </div>
      <div className="scope-quote-visual">
        <Image
          key={quote.image}
          src={quote.image}
          alt={quote.imageAlt}
          fill
          sizes="(max-width: 899px) 100vw, 44vw"
          className="scope-quote-image"
        />
        <span key={`caption-${index}`} className="scope-quote-caption">
          {quote.caption}
        </span>
      </div>
    </figure>
  );
}
