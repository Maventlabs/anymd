import {
  SiAwwwards,
  SiBehance,
  SiDribbble,
  SiFigma,
  SiGithub,
  SiNextdotjs,
  SiReact,
  SiVercel,
} from "@icons-pack/react-simple-icons";
import { Marquee } from "@/components/ui/marquee";

const ecosystem = [
  { name: "Figma", Icon: SiFigma },
  { name: "Behance", Icon: SiBehance },
  { name: "Dribbble", Icon: SiDribbble },
  { name: "Awwwards", Icon: SiAwwwards },
  { name: "GitHub", Icon: SiGithub },
  { name: "Vercel", Icon: SiVercel },
  { name: "React", Icon: SiReact },
  { name: "Next.js", Icon: SiNextdotjs },
];

export default function HeroLogoMarquee() {
  return (
    <div
      className="hero-ecosystem"
      role="region"
      aria-label="Tools and communities around product building"
      data-gsap-hero="proof"
    >
      <p className="hero-ecosystem-label">
        Examples from the product-building ecosystem
      </p>
      <Marquee
        className="hero-logo-marquee"
        pauseOnHover
        repeat={4}
      >
        {ecosystem.map(({ name, Icon }) => (
          <span className="hero-logo-item" key={name}>
            <Icon aria-hidden="true" color="currentColor" size={20} />
            <span>{name}</span>
          </span>
        ))}
      </Marquee>
    </div>
  );
}
