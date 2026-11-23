"use client";

import { Lock } from "lucide-react";
import LogoMark from "./LogoMark";
import { PHONE_TEL, PHONE_DISPLAY, whatsappLink, DEFAULT_ORDER_MESSAGE } from "@/lib/tiers";

export default function Footer({ onOwner }: { onOwner: () => void }) {
  return (
    <footer className="mt-auto bg-brand-deep text-cream/75 pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto px-5 pt-10 text-center">
        <div className="flex justify-center">
          <LogoMark size={64} />
        </div>
        <p className="mt-3 font-display text-xl font-semibold tracking-[0.18em] text-cream">
          AL-KAWSAR
        </p>
        <p className="mt-1.5 font-bengali text-sm font-semibold text-gold-light">
          সততার সাথে সংগৃহীত। বিশ্বাসের সাথে বিক্রি।
        </p>

        <div className="mt-5 flex flex-col items-center gap-2">
          <a
            href={`tel:${PHONE_TEL}`}
            className="text-lg font-bold text-gold-light tracking-wide transition hover:text-gold"
          >
            {PHONE_DISPLAY}
          </a>
          <a
            href={whatsappLink(DEFAULT_ORDER_MESSAGE)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cream/60 transition hover:text-gold-light"
          >
            WhatsApp ৩ ফোন · একই নম্বর
          </a>
        </div>

        <p className="mt-4 text-[11px] leading-relaxed text-cream/50">
          প্রিমিয়াম সুকারি খেজুর · ডিস্ট্রিবিউটর ও রিটেইলার সরবরাহ
        </p>

        <div className="mt-6 border-t border-gold/15 pt-4 flex items-center justify-between text-[11px] text-cream/45">
          <span>© ২০২৭ AL-KAWSAR</span>
          <button
            type="button"
            onClick={onOwner}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/25 text-gold-light/80 transition hover:bg-white/5 hover:text-gold-light hover:border-gold/50"
            aria-label="মালিক প্যানেল খুলুন"
            title="মালিক প্যানেল"
          >
            <Lock size={15} />
          </button>
        </div>
      </div>
    </footer>
  );
}
