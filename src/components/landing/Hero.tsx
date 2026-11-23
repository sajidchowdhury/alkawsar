"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, BadgeCheck, ChevronLeft, ChevronRight, HandCoins, MessageCircle, Truck } from "lucide-react";
import LogoMark from "./LogoMark";
import { whatsappLink, DEFAULT_ORDER_MESSAGE } from "@/lib/tiers";

const HERO_SLIDES = [
  {
    src: "/images/sukkari-hero-1.png",
    alt: "সোনালি আম্বার রঙের প্রিমিয়াম সুকারি খেজুর বাটিতে সাজানো",
    caption: "১০০% খাঁটি সুকারি · সরাসরি আমদানি",
    badge: "A ও B গ্রেড",
  },
  {
    src: "/images/sukkari-hero-2.png",
    alt: "কাঠের পেটিতে তাজা চালানের সুকারি খেজুর",
    caption: "তাজা চালান · প্রতি বাক্সে সেরা দানা",
    badge: "সুকারি · সৌদি",
  },
];

const WORD = "AL-KAWSAR".split("");

const FLOATING_DATES = [
  { left: "8%", top: "18%", size: 26, duration: 5.5, delay: 0 },
  { left: "86%", top: "26%", size: 20, duration: 6.5, delay: 0.8 },
  { left: "14%", top: "58%", size: 18, duration: 7, delay: 1.4 },
  { left: "80%", top: "62%", size: 24, duration: 5, delay: 0.5 },
  { left: "50%", top: "10%", size: 14, duration: 8, delay: 2 },
];

function FloatingDate({ left, top, size, duration, delay }: (typeof FLOATING_DATES)[number]) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left, top }}
      animate={{ y: [0, -14, 0], rotate: [0, 8, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <svg width={size} height={size * 1.5} viewBox="0 0 20 30">
        <ellipse cx="10" cy="15" rx="8" ry="13" fill="#C9A961" opacity="0.85" />
        <ellipse cx="7.5" cy="11" rx="2.6" ry="6" fill="#E0C892" opacity="0.9" />
      </svg>
    </motion.div>
  );
}

function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    setIndex(((next % HERO_SLIDES.length) + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % HERO_SLIDES.length), 4500);
    return () => window.clearInterval(t);
  }, [paused]);

  const slide = HERO_SLIDES[index];

  return (
    <div
      className="relative mt-10 rounded-3xl overflow-hidden border border-gold/30 shadow-2xl shadow-black/30"
      onTouchStart={(e) => {
        touchX.current = e.touches[0].clientX;
        setPaused(true);
      }}
      onTouchEnd={(e) => {
        if (touchX.current !== null) {
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        }
        touchX.current = null;
        setPaused(false);
      }}
    >
      <div className="relative aspect-[16/10]">
        {/* both slides stay mounted so images preload and crossfade instantly */}
        {HERO_SLIDES.map((s, i) => (
          <motion.div
            key={s.src}
            initial={false}
            animate={{ opacity: i === index ? 1 : 0, scale: i === index ? 1 : 1.04 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="absolute inset-0"
            aria-hidden={i !== index}
          >
            <Image
              src={s.src}
              alt={s.alt}
              fill
              priority={i === 0}
              loading="eager"
              sizes="(max-width: 768px) 100vw, 700px"
              className="object-cover"
            />
          </motion.div>
        ))}
        <div
          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-brand-deep/80 to-transparent"
          aria-hidden
        />

        {/* arrows */}
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="আগের ছবি"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-deep/45 text-cream backdrop-blur-sm transition hover:bg-brand-deep/70 active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="পরের ছবি"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-deep/45 text-cream backdrop-blur-sm transition hover:bg-brand-deep/70 active:scale-95"
        >
          <ChevronRight size={20} />
        </button>

        {/* dots */}
        <div className="absolute bottom-[3.4rem] left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`স্লাইড ${i + 1}`}
              aria-current={i === index}
              className={cnDot(i === index)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`cap-${index}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35 }}
          className="absolute bottom-3 left-3 right-3 flex items-end justify-between"
        >
          <p className="font-bengali text-sm font-semibold text-cream drop-shadow">{slide.caption}</p>
          <span className="rounded-full bg-gold px-3 py-1 text-[11px] font-bold text-brand-deep">
            {slide.badge}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function cnDot(active: boolean) {
  return [
    "h-2 rounded-full transition-all duration-300",
    active ? "w-6 bg-gold" : "w-2 bg-cream/60 hover:bg-cream",
  ].join(" ");
}

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-brand-deep via-brand to-brand"
      aria-label="ভূমিকা"
    >
      {/* ambient glows + grain */}
      <div className="absolute inset-0 ak-grain" aria-hidden />
      <div
        className="absolute -top-24 -right-20 h-72 w-72 rounded-full bg-gold/15 blur-3xl pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute top-1/2 -left-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl pointer-events-none"
        aria-hidden
      />
      {FLOATING_DATES.map((d, i) => (
        <FloatingDate key={i} {...d} />
      ))}

      <div className="relative max-w-xl md:max-w-3xl mx-auto px-5 pt-12 pb-10 text-center">
        {/* season badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[11px] sm:text-xs font-semibold tracking-wider text-gold-light"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-ak-pulse-dot" aria-hidden />
          প্রিমিয়াম সুকারি খেজুর · পাইকারি সরবরাহ
        </motion.div>

        {/* animated logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mt-7 flex justify-center"
        >
          <LogoMark size={112} animated />
        </motion.div>

        {/* wordmark */}
        <h1 className="mt-4 font-display text-4xl sm:text-5xl font-semibold text-cream tracking-[0.16em]">
          {WORD.map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.045, duration: 0.4 }}
            >
              {ch}
            </motion.span>
          ))}
        </h1>

        {/* tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mt-3 font-bengali font-bold text-lg sm:text-xl text-gold-light"
        >
          সততার সাথে সংগৃহীত। বিশ্বাসের সাথে বিক্রি।
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.05, duration: 0.6 }}
          className="mt-2 text-sm text-cream/75 max-w-md mx-auto leading-relaxed"
        >
          সরাসরি ইমপোর্টার সূত্র থেকে সুকারি খেজুর — গ্রেড যা বলি, ঠিক তা-ই পাবেন; দাম যা দেখছেন,
          সেটাই চূড়ান্ত।
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <a
            href="#prices"
            className="group inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-gold px-7 py-3 font-bold text-sm text-brand-deep shadow-lg shadow-gold/20 transition hover:bg-gold-light hover:shadow-gold/30 active:scale-[0.98]"
          >
            আজকের দাম দেখুন
            <ArrowDown size={16} className="transition-transform group-hover:translate-y-0.5" />
          </a>
          <a
            href={whatsappLink(DEFAULT_ORDER_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-cream/30 px-7 py-3 font-semibold text-sm text-cream transition hover:border-gold hover:text-gold-light active:scale-[0.98]"
          >
            <MessageCircle size={16} />
            WhatsApp: 01731 779724
          </a>
        </motion.div>

        {/* trust chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-cream/70"
        >
          <span className="inline-flex items-center gap-1.5">
            <BadgeCheck size={14} className="text-gold" /> যাচাইযোগ্য গ্রেড
          </span>
          <span className="inline-flex items-center gap-1.5">
            <HandCoins size={14} className="text-gold" /> স্বচ্ছ দাম
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Truck size={14} className="text-gold" /> নির্ভরযোগ্য ডেলিভারি
          </span>
        </motion.div>

        {/* hero image slider */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.7 }}
        >
          <HeroSlider />
        </motion.div>
      </div>

      {/* wave divider into cream */}
      <div className="relative" aria-hidden>
        <svg
          viewBox="0 0 1440 70"
          preserveAspectRatio="none"
          className="block w-full h-[46px] text-cream"
          fill="currentColor"
        >
          <path d="M0,40 C240,70 480,10 720,30 C960,50 1200,20 1440,45 L1440,70 L0,70 Z" />
        </svg>
      </div>
    </section>
  );
}
