import { Zap } from "lucide-react";

interface SynapseLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
}

const sizes = { sm: 32, md: 40, lg: 56 };
const iconSizes = { sm: 14, md: 18, lg: 24 };
const textSizes = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };

const SynapseLogo = ({ size = "md", variant = "dark" }: SynapseLogoProps) => {
  const s = sizes[size];
  const iconS = iconSizes[size];

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="hexagon-clip bg-gradient-hero flex items-center justify-center"
        style={{ width: s, height: s }}
      >
        <Zap size={iconS} className="text-primary-foreground" fill="currentColor" />
      </div>
      <span className={`${textSizes[size]} font-black tracking-tight ${variant === "dark" ? "text-foreground" : "text-primary-foreground"}`}>
        SYNAPSE<span className="text-gradient-hero">SHIFT</span>
      </span>
    </div>
  );
};

export default SynapseLogo;
