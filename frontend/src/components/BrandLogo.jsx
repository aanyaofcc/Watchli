import { Link } from "react-router-dom";

function logoFrameClassName(size) {
  switch (size) {
    case "footer":
      return "h-10 w-10";
    case "legal":
      return "h-11 w-11";
    case "dashboard":
      return "h-11 w-11";
    case "hero":
    default:
      return "h-11 w-11";
  }
}

function logoImageClassName(size) {
  switch (size) {
    case "footer":
      return "w-[74px]";
    case "legal":
      return "w-[78px]";
    case "dashboard":
      return "w-[78px]";
    case "hero":
    default:
      return "w-[78px]";
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
        className={`absolute left-1/2 top-1/2 max-w-none -translate-x-1/2 -translate-y-[46%] ${logoImageClassName(size)}`.trim()}
      />
    </div>
  );
}

function brandText(size) {
  switch (size) {
    case "footer":
      return {
        title: "text-base",
        subtitle: "Website watcher"
      };
    case "legal":
      return {
        title: "text-lg",
        subtitle: "Legal"
      };
    case "dashboard":
      return {
        title: "text-lg",
        subtitle: "Dashboard"
      };
    case "hero":
    default:
      return {
        title: "text-lg",
        subtitle: "Website watcher"
      };
  }
}

export function BrandLogoLink({ to = "/", size = "hero", subtitle, className = "" }) {
  const details = brandText(size);

  return (
    <Link to={to} className={`flex items-center gap-3 ${className}`.trim()}>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-0 shadow-soft backdrop-blur-sm">
        <BrandLogo size={size} />
      </div>
      <div>
        <p className={`display-font font-bold tracking-wide text-white ${details.title}`.trim()}>
          Watchli
        </p>
        <p className="text-xs uppercase tracking-[0.22em] text-slate-400">
          {subtitle || details.subtitle}
        </p>
      </div>
    </Link>
  );
}
