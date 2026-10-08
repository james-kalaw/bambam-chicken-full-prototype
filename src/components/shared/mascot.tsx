import Image from "next/image";
import { cn } from "@/lib/utils";

// The ONLY place mascot image paths are written. Use <Mascot mood="..." /> everywhere.
// The PNGs have white backgrounds, so "mix-blend-multiply" lets them blend into
// light surfaces. On dark/colored surfaces, place the mascot inside a white shape.
// The mascot is not named yet — the owners will approve a name later.

export type MascotMood =
  | "happy"
  | "excited"
  | "hungry"
  | "surprised"
  | "thinking"
  | "disappointed"
  | "approved"
  | "chatbot-thinking"
  | "chatbot-answering";

const mascotImages: Record<MascotMood, string> = {
  happy: "/mascot/happy.png",
  excited: "/mascot/excited.png",
  hungry: "/mascot/hungry.png",
  surprised: "/mascot/surprised.png",
  thinking: "/mascot/thinking.png",
  disappointed: "/mascot/disappointed.png",
  approved: "/mascot/approved.png",
  "chatbot-thinking": "/mascot/chatbot-thinking.png",
  "chatbot-answering": "/mascot/chatbot-answering.png",
};

const sizes = {
  xs: 32,
  sm: 56,
  md: 96,
  lg: 160,
  xl: 220,
} as const;

interface MascotProps {
  mood: MascotMood;
  size?: keyof typeof sizes;
  className?: string;
  /** Leave empty when the mascot is decorative (most of the time) */
  alt?: string;
  priority?: boolean;
}

export function Mascot({ mood, size = "md", className, alt = "", priority }: MascotProps) {
  const px = sizes[size];
  return (
    <Image
      src={mascotImages[mood]}
      alt={alt}
      width={px}
      height={px}
      priority={priority}
      className={cn("shrink-0 select-none object-contain mix-blend-multiply", className)}
      style={{ width: px, height: px }}
      draggable={false}
    />
  );
}
