import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

const Logo: React.FC<LogoProps> = ({ className = "", showText = true, size = "md" }) => {
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  const textClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-primary rounded-xl flex items-center justify-center shrink-0 p-1.5`}>
        <img src="/logo_transparent.png" alt="StuFolio Logo" className="h-full w-full object-contain" />
      </div>
      {showText && (
        <span className={`font-display ${textClasses[size]} font-bold text-foreground tracking-tight`}>
          StuFolio
        </span>
      )}
    </Link>
  );
};

export default Logo;
