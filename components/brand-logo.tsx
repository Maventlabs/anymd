import Image from "next/image";

export default function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      className={className}
      src="/brand/anymd-logo-transparent.png"
      alt="AnyMD by Mavent"
      width={1774}
      height={887}
      priority
    />
  );
}
