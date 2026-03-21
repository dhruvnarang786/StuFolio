import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  subtitle?: string;
}

const LogoIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2 5V19C2 19 6 17 12 19V5C12 5 6 3 2 5Z" />
    <path d="M22 5V19C22 19 18 17 12 19V5C12 5 18 3 22 5Z" />
    <path d="M8 10.5L6.5 12L8 13.5" />
    <path d="M16 10.5L17.5 12L16 13.5" />
  </svg>
);

const Logo: React.FC<LogoProps> = ({ className = "", showText = true, size = "md", subtitle }) => {
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
      <div className={`${sizeClasses[size]} border-2 border-primary rounded-xl flex items-center justify-center shrink-0 p-1.5 text-primary`}>
        <LogoIcon className="h-full w-full" />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={`font-display ${textClasses[size]} font-bold text-foreground tracking-tight`}>
            StuFolio
          </span>
          {subtitle && (
            <span className="text-[10px] text-muted-foreground font-medium">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </Link>
  );
};

export default Logo;
