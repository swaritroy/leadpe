interface LeadPeLogoProps {
  theme?: "light" | "dark";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "18px",
  md: "26px",
  lg: "34px",
  xl: "48px",
};

const LeadPeLogo = ({ theme = "light", size = "md", className = "" }: LeadPeLogoProps) => {
  const isLight = theme === "light";
  
  return (
    <span 
      className={`font-bold ${className}`} 
      style={{ 
        fontFamily: "Syne, sans-serif",
        fontSize: sizeMap[size],
        letterSpacing: "-0.5px",
        fontWeight: 700,
      }}
    >
      <span style={{ color: isLight ? "#1A1A1A" : "#FFFFFF" }}>Lead</span>
      <span style={{ color: "#00C853" }}>Pe</span>
    </span>
  );
};

export default LeadPeLogo;
