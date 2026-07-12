import { Link } from "react-router-dom";

function logoFrameClassName(size) {
  switch (size) {
    case "footer":
      return "h-[42px] w-[118px] sm:h-[48px] sm:w-[136px]";
    case "legal":
      return "h-[44px] w-[124px] sm:h-[50px] sm:w-[142px]";
    case "dashboard":
      return "h-[40px] w-[112px] sm:h-[44px] sm:w-[124px]";
    case "hero":
    default:
      return "h-[48px] w-[132px] sm:h-[54px] sm:w-[150px]";
  }
}

function logoImageClassName(size) {
  switch (size) {
    case "footer":
      return "w-[172px] sm:w-[198px]";
    case "legal":
      return "w-[178px] sm:w-[204px]";
    case "dashboard":
      return "w-[164px] sm:w-[182px]";
    case "hero":
    default:
      return "w-[188px] sm:w-[214px]";
  }
}

export function BrandLogo({ size = "hero", className = "", alt = "Watchli" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl ${logoFrameClassName(size)} ${className}`.trim()}
    >
      <img
        src="/watchli.png"
        alt={alt}
        className={`absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-[44%] ${logoImageClassName(size)}`.trim()}
      />
    </div>
  );
}

export function BrandLogoLink({ to = "/", size = "hero", subtitle, className = "" }) {
  return (
    <Link to={to} className={`flex items-center ${className}`.trim()}>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 shadow-soft backdrop-blur-sm">
        <BrandLogo size={size} />
      </div>
      {subtitle ? (
        <span className="sr-only">{subtitle}</span>
      ) : null}
    </Link>
  );
}
