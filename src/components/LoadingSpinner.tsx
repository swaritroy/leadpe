interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export default function LoadingSpinner({ fullScreen = true, size = "md", text }: LoadingSpinnerProps) {
  const sizeMap = { sm: "w-6 h-6", md: "w-8 h-8", lg: "w-12 h-12" };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizeMap[size]} border-2 rounded-full animate-spin`}
        style={{ borderColor: "#E0E0E0", borderTopColor: "#00C853" }}
      />
      {text && <p className="text-sm" style={{ color: "#666" }}>{text}</p>}
    </div>
  );

  if (!fullScreen) return spinner;

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#F5FFF7" }}>
      {spinner}
    </div>
  );
}
