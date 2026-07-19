"use client";

import { Logo } from "./Logo";
import { AuthHeroGraphic } from "./AuthHeroGraphic";

export function AuthShell({
  children,
  badge,
  subtitle = "Candidate portal",
  showHero = true,
}: {
  children: React.ReactNode;
  badge?: React.ReactNode;
  subtitle?: string;
  showHero?: boolean;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* ─── LEFT: Dark immersive 3D hero (like 3dyco.com) ─── */}
      {showHero && (
        <div className="hidden lg:block relative lg:w-[55%] xl:w-[58%] bg-black min-h-screen overflow-hidden">
          {/* Logo overlay */}
          <header className="absolute top-0 left-0 right-0 z-30 px-10 xl:px-14 pt-7">
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.05] border border-white/[0.06] backdrop-blur-sm">
              <Logo subtitle={subtitle} dark />
            </div>
          </header>

          {/* The 3D character fills the entire panel */}
          <AuthHeroGraphic />

          {/* Bottom tagline */}
          <div className="absolute bottom-0 left-0 right-0 z-30 px-10 xl:px-14 pb-5">
            <p
              className="text-[11px] uppercase tracking-[0.28em] font-semibold text-white/40"
              style={{ textShadow: "0 0 20px rgba(255,255,255,0.25), 0 0 40px rgba(255,255,255,0.12)" }}
            >
              The Tech Path &mdash; Career Portal
            </p>
          </div>

          {/* Background grid texture */}
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none z-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "80px 80px",
            }}
          />
        </div>
      )}

      {/* ─── RIGHT: Clean light login side ─── */}
      <div className="relative flex-1 flex flex-col bg-[#f8f9fb] min-h-screen lg:min-h-0">
        {/* Mobile: compact dark header with small character */}
        {showHero && (
          <div className="lg:hidden bg-black relative overflow-hidden h-[260px]">
            <header className="absolute top-0 left-0 right-0 z-30 px-5 pt-5">
              <div className="inline-flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.06] backdrop-blur-sm">
                <Logo subtitle={subtitle} dark />
              </div>
            </header>
            <AuthHeroGraphic />
          </div>
        )}

        {!showHero && (
          <header className="w-full px-6 py-5 flex items-center justify-between relative z-10">
            <div className="glass rounded-2xl px-4 py-3 shadow-glass">
              <Logo subtitle={subtitle} />
            </div>
            {badge}
          </header>
        )}

        {/* Login form centered */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-10 lg:py-0">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>

        {/* Badge */}
        {badge && (
          <div className="hidden lg:block absolute top-6 right-6">{badge}</div>
        )}
      </div>
    </div>
  );
}
