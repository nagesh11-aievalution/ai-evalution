import React from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Toaster } from "../components/ui/sonner";
import { Youtube, Instagram, Github } from "lucide-react";
import { NAV_LINKS, SOCIAL_LINKS, SEO_PRESETS } from "../mock/mock";

// Lightweight SEO component (no extra deps). Auto-applies per route.
function SEO() {
  const { pathname } = useLocation();
  const preset = SEO_PRESETS[pathname] || SEO_PRESETS["/"]; 
  React.useEffect(() => {
    if (!preset) return;
    document.title = preset.title;
    const ensure = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    ensure("description", preset.description);
    ensure("keywords", preset.keywords);
    ensure("og:title", preset.title);
    ensure("og:description", preset.description);
    ensure("twitter:title", preset.title);
    ensure("twitter:description", preset.description);
  }, [pathname]);
  return null;
}

export const Layout = () => {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-black text-white relative overflow-x-hidden">
      <SEO />
      {/* Accent grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent, transparent 1px, transparent 1px, transparent 7.6923%), repeating-linear-gradient(-90deg, #fff, #fff 1px, transparent 1px, transparent 7.6923%)",
        backgroundSize: "100% 100%",
      }} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-[#00FFD1]" />
            <span className="font-[600] tracking-tight text-lg md:text-xl" style={{fontFamily: "Kode Mono, KodeMono, monospace"}}>Frame Studio</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((n) => (
              <NavLink
                key={n.path}
                to={n.path}
                className={({ isActive }) =>
                  `text-[17px] transition-colors ${isActive ? "text-[#6FD2C0]" : "text-white/70 hover:text-white"}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button asChild className="!rounded-none !min-h-14 bg-[#00FFD1] text-black hover:bg-[#00ffd11a] hover:text-[#00FFD1] transition-colors">
              <Link to="/upload">Upload</Link>
            </Button>
            <Button asChild variant="secondary" className="!rounded-none !min-h-14 bg-white/10 text-white hover:bg-white hover:text-black transition-colors">
              <Link to="/gallery">View Gallery</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="md:hidden h-16" />
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/20">
        <div className="px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#00FFD1]" />
            <span className="font-[600] text-lg" style={{fontFamily: "Kode Mono, KodeMono, monospace"}}>Frame</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/gallery" className="text-white/70 text-sm">Gallery</Link>
            <Link to="/upload" className="text-black bg-[#00FFD1] px-3 py-2 text-sm">Upload</Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="pt-20 md:pt-24">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/15 mt-24">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-[#00FFD1]" />
              <span className="text-white/90" style={{fontFamily: "Kode Mono, KodeMono, monospace"}}>Frame Studio</span>
            </div>
            <p className="text-white/50 mt-3 text-sm max-w-sm">Where AI meets imagination. Cinematic, luxury and realistic AI video experiences.</p>
          </div>
          <div className="flex gap-6">
            <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white"><Youtube size={22} /></a>
            <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white"><Instagram size={22} /></a>
            <a href={SOCIAL_LINKS.github} target="_blank" rel="noreferrer" className="text-white/70 hover:text-white"><Github size={22} /></a>
          </div>
          <div className="text-right text-white/40 text-sm">© {new Date().getFullYear()} Frame Studio</div>
        </div>
      </footer>

      <Toaster richColors theme="dark" />

      {/* Subtle corner glow */}
      <div className="pointer-events-none fixed -bottom-24 -right-24 w-[420px] h-[420px] rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient( circle at center, #00FFD1 0%, transparent 60% )" }} />
    </div>
  );
};

export default Layout;
