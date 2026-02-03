import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  intensity?: "light" | "medium" | "heavy";
  hoverEffect?: boolean;
  gradientBorder?: boolean;
}

export function GlassCard({ 
  className, 
  intensity = "light", 
  hoverEffect = true,
  gradientBorder = false,
  children, 
  ...props 
}: GlassCardProps) {
  
  const intensityStyles = {
    light: "bg-white/40 backdrop-blur-md border-white/20",
    medium: "bg-white/10 backdrop-blur-lg border-white/10",
    heavy: "bg-black/40 backdrop-blur-xl border-white/5",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-300 shadow-glass",
        intensityStyles[intensity],
        hoverEffect && "hover:-translate-y-1 hover:shadow-glass-hover hover:bg-white/50",
        gradientBorder && "before:absolute before:inset-0 before:-z-10 before:p-[1px] before:bg-gradient-to-br before:from-white/50 before:to-transparent before:rounded-2xl before:content-['']",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}