import { Link } from "react-router-dom";

function logoClassName(size) {
  switch (size) {
    case "footer":
      return "h-auto w-[180px] sm:w-[220px]";
    case "legal":
      return "h-auto w-[170px] sm:w-[210px]";
    case "dashboard":
      return "h-auto w-[150px] sm:w-[180px]";
    case "hero":
    default:
      return "h-auto w-[190px] sm:w-[230px]";
  }
}

export function BrandLogo({ size = "hero", className = "", alt = "Watchli" }) {
  return (
    <img
      src="/watchli.png"
      alt={alt}
      className={`${logoClassName(size)} ${className}`.trim()}
    />
  );
}

export function BrandLogoLink({ to = "/", size = "hero", subtitle, className = "" }) {
  return (
    <Link to={to} className={`flex items-center ${className}`.trim()}>
      <div className="rounded-[22px] border border-white/10 bg-white/[0.06] px-3 py-2 shadow-soft backdrop-blur-sm">
        <BrandLogo size={size} />
      </div>
      {subtitle ? (
        <span className="sr-only">{subtitle}</span>
      ) : null}
    </Link>
  );
}
