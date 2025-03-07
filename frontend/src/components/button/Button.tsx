import React, { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  state?: "primary" | "secondary" | "destructive";
  size?: "small" | "medium" | "large";
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  disabled,
  state = "primary",
  size = "small",
  ...allProps
}) => {
  let buttonStyles = "border-foreground";
  if (state === "primary") {
    buttonStyles += ` bg-foreground hover:opacity-80 text-background`;
  } else if (state === "secondary") {
    buttonStyles += ` bg-transparent text-foreground hover:bg-white/10`;
  } else if (state === "destructive") {
    buttonStyles =
      "border-red-500 bg-transparent hover:bg-red-900/50 text-red-600";
  }

  let sizeStyles = "text-xs px-2 py-[6px] font-semibold ";
  if (size === "large") {
    sizeStyles = "text-lg px-4 py-2 font-regular tracking-wider";
  } else if (size === "medium") {
    sizeStyles = "text-sm px-2 py-2 font-semibold";
  }

  buttonStyles += " " + sizeStyles;

  return (
    <button
      className={`flex flex-row ${
        disabled ? "pointer-events-none" : ""
      } ${size} font-mono uppercase ${buttonStyles} transition-all border ease-out duration-250 ${className}`}
      {...allProps}
    >
      {children}
    </button>
  );
};
