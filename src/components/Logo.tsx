import Image from "next/image";
import { BRAND, BRAND_SHORT } from "@/lib/brand";
import logo from "../../public/logo.png";

export function Logo({ size = 44, text = true }: { size?: number; text?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Image src={logo} alt="" width={size} height={size} className="wiggle shrink-0 mix-blend-multiply" priority />
      {text && (
        <span className="font-display text-[1.35rem] leading-none">
          <span className="hidden md:inline">{BRAND}</span>
          <span className="md:hidden">{BRAND_SHORT}</span>
        </span>
      )}
    </span>
  );
}
