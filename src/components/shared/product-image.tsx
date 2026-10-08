import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Product photo placeholder. Shows the real photo when `image` is set,
 * otherwise a warm gradient tile with an emoji (until Bambam provides photos).
 */
export function ProductImage({ emoji, image, name, className, size = "md" }: {
  emoji: string;
  image?: string;
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const emojiSize = { sm: "text-2xl", md: "text-5xl", lg: "text-7xl" }[size];

  if (image) {
    return (
      <div className={cn("relative overflow-hidden bg-bambam-cream", className)}>
        <Image src={image} alt={name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "grid place-items-center bg-gradient-to-br from-bambam-yellow via-bambam-cream to-orange-200",
        className,
      )}
      role="img"
      aria-label={`${name} (photo placeholder)`}
    >
      <span className={cn(emojiSize, "drop-shadow-sm")} aria-hidden>{emoji}</span>
    </div>
  );
}
