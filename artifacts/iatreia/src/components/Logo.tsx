import { Link } from "react-router-dom";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  asLink?: boolean;
}

const sizes = {
  sm: "h-8",
  md: "h-11",
  lg: "h-14",
};

export const Logo = ({ size = "md", className = "", asLink = true }: LogoProps) => {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const img = (
    <img
      src={`${base}/logo.png`}
      alt="iatreia.gr"
      className={`${sizes[size]} w-auto object-contain ${className}`}
    />
  );

  if (!asLink) return img;
  return (
    <Link to="/" className="flex items-center">
      {img}
    </Link>
  );
};
