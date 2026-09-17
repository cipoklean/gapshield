"use client";

import { useState, useEffect } from "react";
import { IconMenu, IconX, IconShieldCheck } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Terminal", href: "#analyze" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? "py-3" 
          : "py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Floating pill nav */}
        <div className={`
          flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500
          ${scrolled 
            ? "glass border border-border/50" 
            : "bg-transparent"
          }
        `}>
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="relative">
              <IconShieldCheck className="w-7 h-7 text-gold group-hover:drop-shadow-[0_0_12px_rgba(201,162,39,0.6)] transition-all duration-300" stroke={1.5} />
              <div className="absolute inset-0 w-7 h-7 bg-gold/20 rounded-full blur-lg group-hover:bg-gold/30 transition-all" />
            </div>
            <span className="headline text-lg text-ink tracking-tight">
              Gap<span className="text-gold">Shield</span>
            </span>
          </a>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-ink-muted hover:text-gold transition-colors duration-300 text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
            <a
              href="#analyze"
              className="px-5 py-2.5 bg-gradient-to-r from-gold to-gold-light text-bg-deep font-semibold rounded-full hover:shadow-[0_0_30px_rgba(201,162,39,0.35)] active:scale-[0.98] transition-all duration-300 text-sm"
            >
              Launch Terminal
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-ink hover:text-gold transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <IconX className="w-6 h-6" stroke={1.5} /> : <IconMenu className="w-6 h-6" stroke={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 top-16 glass-gold z-40 flex flex-col items-center justify-center gap-8"
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.1 + 0.1 }}
                onClick={() => setMobileOpen(false)}
                className="text-2xl text-ink hover:text-gold transition-colors"
              >
                {link.label}
              </motion.a>
            ))}
            <motion.a
              href="#analyze"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => setMobileOpen(false)}
              className="px-8 py-4 bg-gradient-to-r from-gold to-gold-light text-bg-deep font-semibold rounded-full text-lg"
            >
              Launch Terminal
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
