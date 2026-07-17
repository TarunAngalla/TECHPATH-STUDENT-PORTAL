import { Logo } from "./Logo";
import { AuthBackground } from "./AuthBackground";
import { AuthHeroTagline } from "./AuthHeroTagline";

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
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <AuthBackground />

      <header className="w-full px-6 lg:px-10 py-5 flex items-center justify-between relative z-10">
        <div className="glass rounded-2xl px-4 py-3 shadow-glass">
          <Logo subtitle={subtitle} />
        </div>
        {badge}
      </header>

      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-10 py-6 lg:py-10">
        <div className="grid lg:grid-cols-[1fr_minmax(420px,480px)] xl:grid-cols-[1.1fr_480px] gap-10 lg:gap-16 items-center min-h-[calc(100vh-8rem)]">
          {showHero && (
            <aside className="hidden lg:block">
              <AuthHeroTagline />
            </aside>
          )}

          <div className="flex flex-col items-center lg:items-stretch w-full">
            {/* Mobile hero snippet */}
            {showHero && (
              <div className="lg:hidden text-center mb-8 space-y-2">
                <p className="text-2xl sm:text-3xl font-display font-semibold text-text-primary leading-tight">
                  We Don&apos;t Find You Jobs
                </p>
                <p className="text-2xl sm:text-3xl font-display font-semibold text-gradient leading-tight">
                  We Build Your Path.
                </p>
                <p className="text-sm text-text-muted mt-2">
                  From Training to Placement — We&apos;ve Got You Covered.
                </p>
              </div>
            )}

            <div className="w-full flex justify-center lg:justify-end">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
