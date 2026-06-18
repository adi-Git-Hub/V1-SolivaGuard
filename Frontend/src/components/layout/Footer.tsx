import { Link } from "@tanstack/react-router";
import { SolivaLogo } from "@/components/SolivaLogo";

const leftGroup: { title: string; links: { to: string; label: string; external?: boolean }[] } = {
  title: "Company",
  links: [
    { to: "/story", label: "About" },
    { to: "/contact", label: "Contact" },
    { to: "/terms", label: "Terms & Conditions" },
  ],
};

const rightGroup = {
  title: "Account",
  links: [
    { to: "/login", label: "Sign in" },
    { to: "/register", label: "Create account" },
  ],
};

export function Footer() {
  return (
    <footer className="m-footer mt-24 sm:mt-32 border-t border-border/40 bg-background/60 safe-x">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:py-28 md:py-36 md:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3 md:items-center">
          {/* Left Column — Company */}
          <div className="flex flex-col items-center md:items-start order-2 md:order-1">
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#c76600]">
              {leftGroup.title}
            </h4>
            <ul className="space-y-3.5">
              {leftGroup.links.map((l) => (
                <li key={l.to} className="flex justify-center md:justify-start">
                  {l.external ? (
                    <a
                      href={l.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-light text-[#3a2a22]/70 transition-colors hover:text-[#c76600]"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      to={l.to}
                      className="text-sm font-light text-[#3a2a22]/70 transition-colors hover:text-[#c76600]"
                    >
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Center Column — Logo */}
          <div className="flex justify-center order-1 md:order-2">
            <Link
              to="/"
              aria-label="Soliva — Home"
              className="transition-transform duration-500 hover:scale-110"
            >
              <SolivaLogo height={64} />
            </Link>
          </div>

          {/* Right Column — Account */}
          <div className="flex flex-col items-center md:items-end order-3 md:order-3">
            <h4 className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#c76600]">
              {rightGroup.title}
            </h4>
            <ul className="space-y-3.5">
              {rightGroup.links.map((l) => (
                <li key={l.to} className="flex justify-center md:justify-end">
                  <Link
                    to={l.to}
                    className="text-sm font-light text-[#3a2a22]/70 transition-colors hover:text-[#c76600]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 text-[0.7rem] font-medium tracking-wide text-[#3a2a22]/40 sm:flex-row sm:justify-between md:px-8 safe-bottom">
          <span>© 2026 Soliva. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <span className="italic font-light">Built for movement.</span>
            <span className="h-3 w-px bg-[#3a2a22]/10" />
            <span>Made with care</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
