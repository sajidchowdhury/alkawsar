"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { whatsappLink, DEFAULT_ORDER_MESSAGE } from "@/lib/tiers";

/** Mobile bottom quick-action bar — appears after scrolling past the hero. */
export default function StickyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="fixed inset-x-0 bottom-0 z-40 md:hidden"
        >
          <div className="border-t border-gold/35 bg-brand/95 backdrop-blur px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
            <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => document.getElementById("prices")?.scrollIntoView({ behavior: "smooth" })}
                className="flex-1 text-left"
                aria-label="দামের সেকশনে যান"
              >
                <p className="font-bengali text-[13px] font-bold text-cream leading-tight">
                  আজকের দাম দেখুন
                </p>
                <p className="text-[11px] text-gold-light/90">সুকারি জুসি · সুকারি হার্ড — লাইভ রেট</p>
              </button>
              <a
                href={whatsappLink(DEFAULT_ORDER_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-gold px-5 py-2.5 font-bold text-[13px] text-brand-deep shadow-lg shadow-black/25 active:scale-95 transition"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
