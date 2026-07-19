export function AuthBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Mesh + brand glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 10% 20%, rgba(107, 78, 255, 0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 90% 80%, rgba(14, 124, 123, 0.16), transparent 50%), radial-gradient(ellipse 50% 40% at 50% 50%, rgba(15, 76, 129, 0.08), transparent 60%)",
        }}
      />

      {/* Soft geometric blobs */}
      <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-accent/10 blur-3xl animate-path-drift" />
      <div
        className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] rounded-full bg-brand-500/10 blur-3xl animate-path-drift"
        style={{ animationDelay: "-3s" }}
      />
      <div
        className="absolute -bottom-20 left-1/4 w-[24rem] h-[24rem] rounded-full bg-brand-600/8 blur-3xl animate-path-drift"
        style={{ animationDelay: "-5s" }}
      />

      {/* Career path motif */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        <path
          d="M0 400 Q300 200 600 400 T1200 400"
          stroke="url(#pathGrad)"
          strokeWidth="2"
          strokeDasharray="8 12"
          className="animate-path-drift"
        />
        <path
          d="M0 520 Q400 320 800 520 T1200 520"
          stroke="url(#pathGrad)"
          strokeWidth="1.5"
          strokeDasharray="6 10"
          style={{ animationDelay: "-2s" }}
          className="animate-path-drift"
        />
        <circle cx="200" cy="380" r="6" fill="#6B4EFF" opacity="0.5" />
        <circle cx="600" cy="400" r="8" fill="#0E7C7B" opacity="0.5" />
        <circle cx="1000" cy="420" r="6" fill="#0F4C81" opacity="0.5" />
        <defs>
          <linearGradient id="pathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0F4C81" />
            <stop offset="50%" stopColor="#0E7C7B" />
            <stop offset="100%" stopColor="#6B4EFF" />
          </linearGradient>
        </defs>
      </svg>

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,76,129,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(15,76,129,0.4) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
