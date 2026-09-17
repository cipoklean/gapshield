"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

// ─── Parallax Grid Background ───
function ParallaxGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const y = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Perspective grid */}
      <motion.div
        style={{ y, opacity }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200vw] h-[100vh]"
      >
        <svg className="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice">
          <defs>
            <linearGradient id="gridGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(201,162,39,0.02)" />
              <stop offset="100%" stopColor="rgba(201,162,39,0.06)" />
            </linearGradient>
          </defs>
          {/* Vertical lines */}
          {Array.from({ length: 25 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 50}
              y1={250}
              x2={i * 50 - 80}
              y2={600}
              stroke="url(#gridGrad)"
              strokeWidth="1"
            />
          ))}
          {/* Horizontal lines */}
          {Array.from({ length: 10 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={280 + i * 35}
              x2={1200}
              y2={280 + i * 35}
              stroke="url(#gridGrad)"
              strokeWidth="1"
            />
          ))}
        </svg>
      </motion.div>

      {/* Floating data points */}
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-gold/30"
          style={{
            left: `${8 + (i * 53) % 84}%`,
            top: `${15 + (i * 37) % 65}%`,
          }}
          animate={{
            y: [0, -12, 0],
            opacity: [0.2, 0.7, 0.2],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 3 + (i % 3),
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
        />
      ))}

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
    </div>
  );
}

// ─── Mini Terminal Preview (Product Visual in Hero) ───
function HeroTerminalPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mt-16 w-full max-w-4xl mx-auto"
    >
      {/* Outer shell (double-bezel) */}
      <div className="rounded-3xl p-1.5 bg-gradient-to-b from-white/10 to-transparent">
        {/* Inner core */}
        <div className="rounded-[22px] glass overflow-hidden">
          {/* Terminal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
            <span className="font-mono text-xs text-ink-faint">gapshield://terminal</span>
            <span className="font-mono text-xs text-ink-faint">live</span>
          </div>
          
          {/* Terminal content */}
          <div className="p-6 space-y-4">
            {/* Input line */}
            <div className="flex items-center gap-3 font-mono text-sm">
              <span className="text-gold">$</span>
              <span className="text-ink-muted">analyze</span>
              <span className="text-ink">AAPL</span>
              <span className="w-2 h-5 bg-gold/80 animate-pulse" />
            </div>
            
            {/* Scan line effect */}
            <div className="relative h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent my-4">
              <div className="absolute inset-0 shimmer-bar" />
            </div>
            
            {/* Results preview */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <div className="label-mono">Risk Score</div>
                <div className="text-3xl font-display text-risk-high" style={{ textWrap: "balance" }}>72</div>
                <div className="text-xs text-ink-faint">HIGH RISK</div>
              </div>
              <div className="space-y-1">
                <div className="label-mono">Bias</div>
                <div className="text-2xl font-display text-ink" style={{ textWrap: "balance" }}>Bearish</div>
                <div className="text-xs text-ink-faint">-2.4% expected</div>
              </div>
              <div className="space-y-1">
                <div className="label-mono">Confidence</div>
                <div className="text-2xl font-display text-gold" style={{ textWrap: "balance" }}>87%</div>
                <div className="text-xs text-ink-faint">Strong signal</div>
              </div>
            </div>
            
            {/* Key driver */}
            <div className="pt-4 border-t border-border/50">
              <div className="label-mono mb-2">Weekend Driver</div>
              <p className="text-sm text-ink-muted">China export restrictions on semiconductor components affecting iPhone supply chain</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Hero Component ───
export function CinematicHero() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.35], [0, 60]);
  const scale = useTransform(scrollYProgress, [0, 0.35], [1, 0.96]);

  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-center items-center px-6 pt-32 pb-20 overflow-hidden">
      <ParallaxGrid />
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-deep/30 to-bg-deep pointer-events-none" />
      
      <motion.div
        style={{ opacity, y, scale }}
        className="relative z-10 text-center max-w-5xl mx-auto"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="label-mono mb-6"
        >
          WEEKEND RISK INTELLIGENCE
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="headline text-6xl md:text-8xl lg:text-9xl text-ink mb-8 pb-1"
          style={{ textWrap: "balance" }}
        >
          The Weekend
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-amber-400">
            Gap
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl md:text-2xl text-ink-muted max-w-2xl mx-auto leading-relaxed font-light"
        >
          US Markets sleep. Tokenized markets don&apos;t.
          <br />
          Know Monday&apos;s risk before Monday arrives.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#analyze"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gold to-gold-light text-bg-deep font-semibold rounded-full hover:shadow-[0_0_50px_rgba(201,162,39,0.4)] active:scale-[0.98] transition-all duration-300"
          >
            <span>Start Analysis</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 px-8 py-4 glass rounded-full text-ink font-medium hover:border-gold/30 transition-all duration-300"
          >
            Learn More
          </a>
        </motion.div>
      </motion.div>

      {/* Product visual */}
      <HeroTerminalPreview />

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-bg-deep to-transparent pointer-events-none" />
    </section>
  );
}
