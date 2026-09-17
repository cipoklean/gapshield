import Navbar from "@/components/Navbar";
import { CinematicHero } from "@/components/CinematicHero";
import AnalyzeSection from "@/components/AnalyzeSection";
import { IconShieldCheck, IconTrendingDown, IconClock, IconBrain } from "@tabler/icons-react";

export default function Home() {
  return (
    <main className="min-h-[100dvh] bg-bg-deep">
      <Navbar />
      
      {/* Noise overlay */}
      <div className="fixed inset-0 noise pointer-events-none z-50 opacity-50" />
      
      <CinematicHero />
      
      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          {/* Only eyebrow on hero, rule is max 1 per 3 sections */}
          <div className="mb-20">
            <h2 className="headline text-5xl md:text-7xl text-ink leading-[1.05]">
              Markets sleep.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-amber-400">
                your portfolio does not.
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: IconClock,
                title: "Friday Close", 
                desc: "US equities halt at 4pm ET. Tokenized stocks trade through Saturday, Sunday, and beyond.",
                accent: "from-blue-500/20 to-blue-500/5"
              },
              { 
                icon: IconTrendingDown,
                title: "Weekend Events", 
                desc: "Geopolitical shocks, earnings leaks, and regulatory moves hit 24/7 markets while you sleep.",
                accent: "from-amber-500/20 to-amber-500/5"
              },
              { 
                icon: IconBrain,
                title: "Monday Open", 
                desc: "GapShield analyzes the entire weekend, delivering a shield report before the bell rings.",
                accent: "from-emerald-500/20 to-emerald-500/5"
              }
            ].map((step, i) => (
              <FeatureCard key={i} {...step} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Terminal */}
      <AnalyzeSection />

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <IconShieldCheck className="w-6 h-6 text-gold" />
            <span className="headline text-xl text-ink">
              Gap<span className="text-gold">Shield</span>
            </span>
          </div>
          <p className="text-ink-faint text-sm">
            Weekend Risk Intelligence for the 24/7 Market Era
          </p>
          <div className="flex gap-8 text-sm text-ink-faint">
            <a href="#" className="hover:text-gold transition-colors duration-300">GitHub</a>
            <a href="#" className="hover:text-gold transition-colors duration-300">Docs</a>
            <a href="#" className="hover:text-gold transition-colors duration-300">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon: Icon, title, desc, accent, delay }: { icon: React.ComponentType<{ className?: string; stroke?: number }>; title: string; desc: string; accent: string; delay: number }) {
  return (
    <div
      className="glass rounded-2xl p-8 hover:border-gold/30 transition-all duration-500 group"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
        <Icon className="w-6 h-6 text-ink" stroke={1.5} />
      </div>
      <h3 className="headline text-xl text-ink mb-3">{title}</h3>
      <p className="text-ink-muted leading-relaxed">{desc}</p>
    </div>
  );
}
