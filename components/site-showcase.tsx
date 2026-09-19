import { ImageIcon } from "lucide-react";
import { Marquee } from "@/components/ui/marquee";

const previews = [
  "Client portal",
  "Habit companion",
  "Local marketplace",
  "Tutor workspace",
  "Research library",
  "Launch dashboard",
];

function ProductConcept({ label, index }: { label: string; index: number }) {
  return (
    <figure className="preview-card">
      <div
        className={`preview-placeholder preview-pattern-${(index % 3) + 1}`}
        role="img"
         aria-label={`Illustrative ${label} product concept`}
      >
        <div className="preview-browser-bar">
          <span />
          <span />
          <span />
        </div>
        <div className="preview-wireframe" aria-hidden="true">
          <span className="preview-copy" />
          <span className="preview-title" />
          <span className="preview-title short" />
          <span className="preview-action" />
          <span className="preview-visual">
            <ImageIcon />
          </span>
        </div>
      </div>
      <figcaption>
         <span>Product concept {String(index + 1).padStart(2, "0")}</span>
        <strong>{label}</strong>
      </figcaption>
    </figure>
  );
}

export default function SiteShowcase() {
  return (
    <div className="showcase-marquees" data-reveal>
      <Marquee pauseOnHover repeat={3} className="preview-marquee">
        {previews.slice(0, 4).map((label, index) => (
          <ProductConcept key={label} label={label} index={index} />
        ))}
      </Marquee>
      <Marquee reverse pauseOnHover repeat={3} className="preview-marquee slow">
        {previews.slice(2).map((label, index) => (
          <ProductConcept key={label} label={label} index={index + 2} />
        ))}
      </Marquee>
    </div>
  );
}
