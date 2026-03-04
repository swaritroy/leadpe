interface LeadPeLogoProps {
  size?: "sm" | "md" | "lg";
}

const textSizes = { sm: "text-xl", md: "text-2xl", lg: "text-3xl" };

const LeadPeLogo = ({ size = "md" }: LeadPeLogoProps) => {
  return (
    <span className={`${textSizes[size]} font-extrabold tracking-tight`} style={{ fontFamily: 'Syne, sans-serif' }}>
      <span className="text-foreground">Lead</span>
      <span className="text-primary">Pe</span>
    </span>
  );
};

export default LeadPeLogo;
