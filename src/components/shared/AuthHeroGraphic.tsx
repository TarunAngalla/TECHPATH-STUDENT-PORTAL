"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import { GraduationCap, FileSignature, Megaphone, MessageSquare, Users, Rocket } from "lucide-react";
import heroPath from "../../../public/images/hero_path_dark.png";

const ANNOUNCEMENTS = [
  { icon: GraduationCap, label: "01", title: "Training", desc: "Industry-aligned programs", color: "#60a5fa" },
  { icon: FileSignature, label: "02", title: "Profile Ready", desc: "Resume & portal setup", color: "#a78bfa" },
  { icon: Megaphone, label: "03", title: "Marketing", desc: "Recruiter-ready profiles", color: "#34d399" },
  { icon: MessageSquare, label: "04", title: "Interview Prep", desc: "Mock sessions & coaching", color: "#fbbf24" },
  { icon: Users, label: "05", title: "Recruiter Match", desc: "Direct employer connections", color: "#f472b6" },
  { icon: Rocket, label: "06", title: "Placement", desc: "Guaranteed career launch", color: "#38bdf8" },
];

const SCROLLING = [...ANNOUNCEMENTS, ...ANNOUNCEMENTS];

export function AuthHeroGraphic() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rawRotateX = useTransform(mouseY, [-300, 300], [4, -4]);
  const rawRotateY = useTransform(mouseX, [-300, 300], [-4, 4]);
  const rotateX = useSpring(rawRotateX, { stiffness: 60, damping: 25 });
  const rotateY = useSpring(rawRotateY, { stiffness: 60, damping: 25 });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    mouseX.set(event.clientX - (rect.left + rect.width / 2));
    mouseY.set(event.clientY - (rect.top + rect.height / 2));
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ── Layer 0: Ambient lighting ── */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute bottom-0 left-1/3 -translate-x-1/2 w-[60%] h-[50%] bg-blue-600/[0.06] blur-[120px] rounded-full" />
        <div className="absolute top-[10%] right-[10%] w-[280px] h-[280px] bg-cyan-500/[0.04] blur-[90px] rounded-full" />
      </div>

      {/* ── Layer 1: Path visual as full background ── */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1200 }}
        className="absolute inset-0 z-[1]"
      >
        <div className="absolute inset-0">
          <Image
            src={heroPath}
            alt="The Tech Path — journey from training to placement"
            fill
            sizes="55vw"
            className="object-cover object-center opacity-90"
            priority
          />
        </div>
      </motion.div>

      {/* ── Layer 2: Bold tagline overlay ── */}
      <div className="absolute bottom-20 left-10 xl:left-14 z-20 pointer-events-none max-w-[360px] xl:max-w-[400px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-300/70 mb-4">
            Career Portal
          </p>
          <h2 className="text-[42px] xl:text-[48px] font-extrabold text-white leading-[1.05] tracking-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.55)]">
            We Build
            <span className="block bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
              Your Path.
            </span>
          </h2>
          <p className="text-[15px] xl:text-base text-white/55 mt-5 leading-relaxed font-medium max-w-[320px]">
            From training to placement &mdash; all in one portal.
          </p>
        </motion.div>
      </div>

      {/* ── Layer 3: Flowing announcement cards ── */}
      <div className="absolute top-[18%] bottom-[18%] right-8 xl:right-12 z-20 pointer-events-none flex items-center">
        <div
          className="w-[230px] xl:w-[250px] h-full overflow-hidden"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 0%, white 12%, white 88%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, white 12%, white 88%, transparent 100%)",
          }}
        >
          <motion.div
            animate={{ y: [0, -(ANNOUNCEMENTS.length * 118)] }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            className="flex flex-col gap-4"
          >
            {SCROLLING.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="backdrop-blur-xl bg-white/[0.07] border border-white/[0.12] rounded-2xl px-5 py-4 transition-all"
                  style={{ boxShadow: `0 0 28px ${item.color}10` }}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}22` }}
                    >
                      <Icon size={14} style={{ color: item.color }} />
                    </div>
                    <span
                      className="text-[11px] font-bold uppercase tracking-[0.16em]"
                      style={{ color: `${item.color}cc` }}
                    >
                      Step {item.label}
                    </span>
                  </div>
                  <div className="text-[15px] font-semibold text-white leading-snug">
                    {item.title}
                  </div>
                  <div className="text-[12px] text-white/45 mt-1 leading-snug">
                    {item.desc}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* ── Layer 4: Floating particles ── */}
      <div className="absolute inset-0 z-[2] pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-blue-400/30"
            style={{
              left: `${15 + i * 18}%`,
              top: `${20 + i * 12}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.8,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* ── Vignette + readout gradients for overlay contrast ── */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `
            radial-gradient(ellipse at 55% 45%, transparent 35%, rgba(0,0,0,0.45) 100%),
            linear-gradient(to right, rgba(0,0,0,0.55) 0%, transparent 38%, transparent 62%, rgba(0,0,0,0.35) 100%),
            linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 42%)
          `,
        }}
      />
    </div>
  );
}
