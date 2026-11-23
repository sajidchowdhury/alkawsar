"use client";

import { motion } from "framer-motion";
import { Eye, MessageCircle, Package, Phone } from "lucide-react";
import { whatsappLink, DEFAULT_ORDER_MESSAGE, PHONE_TEL, PHONE_DISPLAY } from "@/lib/tiers";

const STEPS = [
  {
    icon: Eye,
    title: "দাম দেখুন",
    desc: "উপরের ক্যালকুলেটরে বাক্স সংখ্যা দিলেই আপনার টিয়ারের রেট দেখাবে।",
  },
  {
    icon: Package,
    title: "স্যাম্পল যাচাই করুন",
    desc: "প্রথমবার? ২ বাক্স স্যাম্পল নিন — বক্স খুলে গ্রেড মিলিয়ে নিন, তারপর সিদ্ধান্ত।",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp-এ নিশ্চিত করুন",
    desc: "সরাসরি আমার সাথেই কথা — মাঝখানে কেউ নেই, উত্তর সোজাসুজি।",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 22 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
};

export default function OrderSection() {
  return (
    <section className="bg-cream py-16 md:py-20" aria-label="অর্ডার প্রক্রিয়া">
      <div className="max-w-2xl mx-auto px-5">
        <motion.header {...fadeUp} transition={{ duration: 0.55 }} className="text-center">
          <p className="text-[11px] font-bold tracking-[0.3em] text-gold-deep">HOW TO ORDER</p>
          <h2 className="mt-1.5 font-bengali text-3xl font-bold text-brand">অর্ডার করবেন যেভাবে</h2>
          <p className="mt-2 text-sm text-stone-warm">আগে স্যাম্পল — তারপর সিদ্ধান্ত। এটাই আমাদের নিয়ম।</p>
        </motion.header>

        <div className="mt-9 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              {...fadeUp}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="rounded-3xl border border-gold/30 bg-linen p-5 text-center shadow-sm"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand text-gold-light">
                <s.icon size={22} />
              </span>
              <p className="mt-2 text-[11px] font-bold text-gold-deep">ধাপ {["১", "২", "৩"][i]}</p>
              <h3 className="font-bengali text-[15px] font-bold text-brand">{s.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-stone-warm">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* contact card */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6 }}
          className="mt-8 overflow-hidden rounded-3xl bg-brand text-center shadow-xl shadow-brand/25"
        >
          <div className="border-b border-gold/20 bg-brand-deep/40 px-6 py-3">
            <p className="text-[11px] font-semibold tracking-[0.22em] text-gold-light/90">
              এক নম্বর · এক প্রতিশ্রুতি
            </p>
          </div>
          <div className="px-6 py-7">
            <a
              href={`tel:${PHONE_TEL}`}
              className="font-bengali text-3xl font-bold text-gold-light tracking-wide transition hover:text-gold"
            >
              {PHONE_DISPLAY}
            </a>
            <p className="mt-1.5 text-xs text-cream/70">কল বা WhatsApp — যেকোনো সময়, সোজা উত্তর।</p>
            <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={whatsappLink(DEFAULT_ORDER_MESSAGE)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-gold px-6 py-3 font-bold text-sm text-brand-deep shadow-lg shadow-gold/25 transition hover:bg-gold-light active:scale-[0.98]"
              >
                <MessageCircle size={17} />
                WhatsApp-এ মেসেজ করুন
              </a>
              <a
                href={`tel:${PHONE_TEL}`}
                className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-cream/30 px-6 py-3 font-semibold text-sm text-cream transition hover:border-gold hover:text-gold-light active:scale-[0.98]"
              >
                <Phone size={16} />
                এখনই কল করুন
              </a>
            </div>
            <p className="mt-5 text-[11px] leading-relaxed text-cream/60">
              প্রথম অর্ডারে ডেলিভারিতে পেমেন্ট · নিয়মিত ক্রেতার জন্য ৭ দিনের বাকি সুবিধা
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
