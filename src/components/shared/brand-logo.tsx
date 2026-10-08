import Image from "next/image";
import { cn } from "@/lib/utils";

// Official Bambam Chicken logo (public/brand/bambam-logo.png, cropped from the original).
// The PNG has a white background, so mix-blend-multiply blends it into light surfaces.

const LOGO_RATIO = 640 / 446; // width / height of the logo file

const heights = { sm: 40, md: 56, lg: 120 } as const;

interface BrandLogoProps {
  className?: string;
  /** Small text beside the logo, e.g. "Business System" */
  subtitle?: string;
  size?: keyof typeof heights;
  priority?: boolean;
}

export function BrandLogo({ className, subtitle, size = "md", priority }: BrandLogoProps) {
  const h = heights[size];
  const w = Math.round(h * LOGO_RATIO);
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/brand/bambam-logo.png"
        alt="Bambam Chicken"
        width={w}
        height={h}
        priority={priority}
        className="shrink-0 select-none mix-blend-multiply"
        style={{ width: w, height: h }}
        draggable={false}
      />
      {subtitle && <span className="text-xs leading-tight font-medium text-muted-foreground">{subtitle}</span>}
    </span>
  );
}
